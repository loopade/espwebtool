import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import ClearIcon from '@mui/icons-material/Clear'
import StopIcon from '@mui/icons-material/Stop'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

import { setCookie, getCookie } from '../lib/cookie.js'
import styles from './Output.module.css'

const Output = (props) => {
    // Currently receieved string & list of previous receieved lines
    const received = useRef('')
    const [lines, setLines] = useState([])

    useEffect(
        () => {
            const str = `${received.current}${props.received.value}`
            const lines = str.split('\n')

            let newReceived = str
            const newLines = []

            if (lines.length > 1) {
                newReceived = lines.pop()

                lines.forEach(line => {
                    newLines.push(`${line}`)
                })
            }
            setLines((current) => current.concat(newLines))
            received.current = newReceived
        },
        [props.received],
    )

    // Output toggle Visibility
    const loadOpen = () => {
        const cookieValue = getCookie('output')
        return cookieValue ? (cookieValue === 'true') : true
    }

    const openOutput = (value) => {
        setVisible(value)
        setCookie('output', value)
    }

    const clearOutput = () => {
        received.current = ''
        setLines([])
        props.onClear?.()
    }

    const [visible, setVisible] = React.useState(loadOpen())

    return (
        <pre className={styles.pre}>
            <>
                { /* Toggle */}
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={visible}
                            onChange={e => openOutput(e.target.checked)}
                            icon={<ChevronRightIcon />}
                            checkedIcon={<KeyboardArrowDownIcon />}
                        />
                    }
                    label="输出"

                />
                <Tooltip title={props.monitoring ? '停止读取串口' : '开始读取串口'}>
                    <IconButton size='small' onClick={props.monitoring ? props.onStop : props.onStart} disabled={!props.canMonitor}>
                        {props.monitoring ? <StopIcon fontSize='small' /> : <PlayArrowIcon fontSize='small' />}
                    </IconButton>
                </Tooltip>
                <Tooltip title='清空日志'>
                    <IconButton size='small' onClick={clearOutput}>
                        <ClearIcon fontSize='small' />
                    </IconButton>
                </Tooltip>
            </>

            { /* Actual Output */}
            {visible &&
                <Box className={styles.box}>
                    <code className={styles.code}>

                        { /* Lines */}
                        {lines.map((line, i) => (
                            <span key={i}>
                                {line}<br />
                            </span>
                        ))}

                    </code>
                </Box>
            }
        </pre>
    )
}

Output.propTypes = {
    received: PropTypes.object,
    monitoring: PropTypes.bool,
    canMonitor: PropTypes.bool,
    onStart: PropTypes.func,
    onStop: PropTypes.func,
    onClear: PropTypes.func,
}

export default Output
