import React, { useEffect } from 'react'

import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import Header from './components/Header'
import Home from './components/Home'
import FileList from './components/FileList'
import Output from './components/Output'
import Buttons from './components/Buttons'
import Settings from './components/Settings'
import ConfirmWindow from './components/ConfirmWindow'
// import Footer from './components/Footer'

import { connectESP, formatMacAddr, sleep, loadFiles, supported } from './lib/esp'
import { loadSettings, defaultSettings } from './lib/settings'

const App = () => {
  const [connected, setConnected] = React.useState(false) // Connection status
  const [connecting, setConnecting] = React.useState(false)
  const [output, setOutput] = React.useState({ time: new Date(), value: '请点击「连接设备」\n' }) // Serial output
  const [espStub, setEspStub] = React.useState(undefined) // ESP flasher stuff
  const [uploads, setUploads] = React.useState([]) // Uploaded Files
  const [settingsOpen, setSettingsOpen] = React.useState(false) // Settings Window
  const [settings, setSettings] = React.useState({...defaultSettings}) // Settings
  const [confirmErase, setConfirmErase] = React.useState(false) // Confirm Erase Window
  const [confirmProgram, setConfirmProgram] = React.useState(false) // Confirm Flash Window
  const [flashing, setFlashing] = React.useState(false) // Enable/Disable buttons
  const [chipName, setChipName] = React.useState('') // ESP8266 or ESP32

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  // Add new message to output
  const addOutput = (msg) => {
    setOutput({
      time: new Date(),
      value: `${msg}\n`,
    })
  }

  // Connect to ESP & init flasher stuff
  const clickConnect = async () => {
    if (espStub) {
      await espStub.disconnect()
      await espStub.port.close()
      setEspStub(undefined)
      return
    }

    const esploader = await connectESP({
      log: (...args) => addOutput(`${args[0]}`),
      debug: (...args) => console.debug(...args),
      error: (...args) => console.error(...args),
      baudRate: parseInt(settings.baudRate),
    })

    try {
      toast.info('连接中...', { 
        position: 'top-center', 
        autoClose: false, 
        toastId: 'connecting' 
      })
      toast.update('connecting', {
        render: '连接中...',
        type: toast.TYPE.INFO,
        autoClose: false
      })

      setConnecting(true)

      await esploader.initialize()

      addOutput(`Connected to ${esploader.chipName}`)
      addOutput(`MAC Address: ${formatMacAddr(esploader.macAddr())}`)

      const newEspStub = await esploader.runStub()

      setConnected(true)
      toast.update('connecting', {
        render: '连接成功 🚀',
        type: toast.TYPE.SUCCESS,
        autoClose: 3000
      })

      //console.log(newEspStub)

      newEspStub.port.addEventListener('disconnect', () => {
        setConnected(false)
        setEspStub(undefined)
        toast.warning('设备已断开连接...', { position: 'top-center', autoClose: 3000, toastId: 'settings' })
        addOutput(`------------------------------------------------------------`)
      })

      setEspStub(newEspStub)
      setUploads(await loadFiles(esploader.chipName))
      setChipName(esploader.chipName)
    } catch (err) {
      const shortErrMsg = `${err}`.replace('Error: ','')

      toast.update('connecting', {
        render: shortErrMsg,
        type: toast.TYPE.ERROR,
        autoClose: 3000
      })

      addOutput(`${err}`)

      await esploader.port.close()
      await esploader.disconnect()
    } finally {
      setConnecting(false)
    }
  }

  // Erase firmware on ESP
  const erase = async () => {
    setConfirmErase(false)
    setFlashing(true)
    toast(`正在擦除，请稍候...`, { position: 'top-center', toastId: 'erase', autoClose: false })

    try {
      const stamp = Date.now()

      addOutput(`Start erasing`)
      const interval = setInterval(() => {
        addOutput(`Erasing flash memory. Please wait...`)
      }, 3000)

      await espStub.eraseFlash()

      clearInterval(interval)
      addOutput(`Finished. Took ${Date.now() - stamp}ms to erase.`)
      toast.update('erase', { render: '擦除完成', type: toast.TYPE.INFO, autoClose: 3000 })
    } catch (e) {
      addOutput(`ERROR!\n${e}`)
      toast.update('erase', { render: `ERROR!\n${e}`, type: toast.TYPE.ERROR, autoClose: 3000 })
      console.error(e)
    } finally {
      setFlashing(false)
    }
  }

  // Flash Firmware
  const program = async () => {
    setConfirmProgram(false)
    setFlashing(true)

    let success = false

    const toArrayBuffer = (inputFile) => {
      const reader = new FileReader()

      return new Promise((resolve, reject) => {
        reader.onerror = () => {
          reader.abort();
          reject(new DOMException('Problem parsing input file.'));
        }

        reader.onload = () => {
          resolve(reader.result);
        }
        reader.readAsArrayBuffer(inputFile)
      })
    }

    for (const file of uploads) {
      if (!file.fileName || !file.obj) continue
      success = true

      toast(`上传${file.fileName.substring(0, 28)}中...`, { position: 'top-center', progress: 0, toastId: 'upload' })

      try {
        const contents = await toArrayBuffer(file.obj)

        await espStub.flashData(
          contents,
          (bytesWritten, totalBytes) => {
            const progress = (bytesWritten / totalBytes)
            const percentage = Math.floor(progress * 100)

            toast.update('upload', { progress: progress })

            addOutput(`Flashing... ${percentage}%`)
          },
          parseInt(file.offset, 16)
        )

        await sleep(100)
      } catch (e) {
        addOutput(`ERROR!`)
        addOutput(`${e}`)
        console.error(e)
      }
    }

    if (success) {
      addOutput(`完成!`)
      addOutput(`请重启设备。`)

      toast.success('完成! 请重启设备。', { position: 'top-center', toastId: 'uploaded', autoClose: 3000 })
    } else {
      addOutput(`请添加 .bin 文件`)

      toast.info('请添加 .bin 文件', { position: 'top-center', toastId: 'uploaded', autoClose: 3000 })
    }

    setFlashing(false)
  }

  return (
    <Box sx={{ minWidth: '25rem' }}>
      <Header sx={{ mb: '1rem' }} />

      <Grid container spacing={1} direction='column' justifyContent='space-around' alignItems='center' sx={{ minHeight: 'calc(100vh - 116px)' }}>

        {/* Home Page */}
        {!connected && !connecting &&
          <Grid item>
            <Home
              connect={clickConnect}
              supported={supported}
              openSettings={() => setSettingsOpen(true)}
            />
          </Grid>
        }

        {/* Home Page */}
        {!connected && connecting &&
          <Grid item>
            <Typography variant='h3' component='h2' sx={{ color: '#aaa' }}>
              连接中...
            </Typography>
          </Grid>
        }

        {/* FileUpload Page */}
        {connected &&
          <Grid item>
            <FileList
              uploads={uploads}
              setUploads={setUploads}
              chipName={chipName}
            />
          </Grid>
        }

        {/* Erase & Program Buttons */}
        {connected &&
          <Grid item>
            <Buttons
              erase={() => setConfirmErase(true)}
              program={() => setConfirmProgram(true)}
              disabled={flashing}
            />
          </Grid>
        }

        {/* Serial Output */}
        {supported() &&
          <Grid item>
            <Output received={output} />
          </Grid>
        }
      </Grid>

      {/* Settings Window */}
      <Settings
        open={settingsOpen}
        close={() => setSettingsOpen(false)}
        setSettings={setSettings}
        settings={settings}
        connected={connected}
      />

      {/* Confirm Erase Window */}
      <ConfirmWindow
        open={confirmErase}
        text={'这将擦除设备上的已有数据。'}
        onOk={erase}
        onCancel={() => setConfirmErase(false)}
      />

      {/* Confirm Flash/Program Window */}
      <ConfirmWindow
        open={confirmProgram}
        text={'烧录新固件将覆盖当前固件。'}
        onOk={program}
        onCancel={() => setConfirmProgram(false)}
      />

      {/* Toaster */}
      <ToastContainer />

      {/* Footer */}
      {/* <Footer sx={{ mt: 'auto' }} /> */}
    </Box>
  )
}

export default App