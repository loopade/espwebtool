import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import FolderIcon from '@mui/icons-material/Folder'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'

import styles from './FileList.module.css'

const FirmwareViewer = () => {
    const [url, setUrl] = useState('https://baohuiming.net/esp/firmwares/')
    const [currentUrl, setCurrentUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [directoryData, setDirectoryData] = useState({
        files: [],
        directories: [],
        currentPath: '/'
    })

    // 解析路径函数
    const pathJoin = (base, part) => {
        return base.replace(/\/$/, '') + '/' + part.replace(/^\//, '')
    }

    // 获取目录数据
    const fetchDirectory = async (targetUrl) => {
        setLoading(true)
        setError('')
        try {
            const response = await fetch(targetUrl)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)

            const data = await response.json()

            // 解析返回的 autoindex JSON
            const directories = []
            const files = []

            data.forEach(item => {
                if (item.type === 'directory') {
                    directories.push(item.name)
                } else if (item.type === 'file') {
                    files.push(item.name)
                }
            })

            // 解析当前路径
            const urlObj = new URL(targetUrl)
            const currentPath = urlObj.pathname

            setDirectoryData({
                files,
                directories,
                currentPath
            })
            setCurrentUrl(targetUrl)
        } catch (err) {
            setError(`加载失败: ${err.message}`)
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (url) {
            fetchDirectory(url)
        }
    }

    const handleEnterFolder = (folderName) => {
        const newUrl = pathJoin(currentUrl, folderName)
        fetchDirectory(newUrl)
    }

    const handleGoBack = () => {
        const urlObj = new URL(currentUrl)
        const pathParts = urlObj.pathname.split('/').filter(p => p)
        if (pathParts.length > 0) {
            pathParts.pop()
            urlObj.pathname = pathParts.join('/') || '/'
            fetchDirectory(urlObj.toString())
        }
    }

    useEffect(() => {
        // 初始化时加载默认URL
        if (url) {
            fetchDirectory(url)
        }
    }, [])

    return (
        <Box className={styles.box}>
            <Typography variant="h6" sx={{ my: 2 }}>
                在线固件获取
            </Typography>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={10}>
                        <TextField
                            fullWidth
                            label="ESP固件URL"
                            variant="outlined"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="/esp/firmwares/"
                        />
                    </Grid>
                    <Grid item xs={2}>
                        <Button
                            variant="contained"
                            type="submit"
                            fullWidth
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : '加载'}
                        </Button>
                    </Grid>
                </Grid>
            </form>

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={2} alignItems="center">
                <Grid item xs={9}>
                    <Typography sx={{ mt: 2 }}>
                        当前路径: {directoryData.currentPath}
                    </Typography>
                </Grid>
                <Grid item xs={3} textAlign='right'>
                    {directoryData.currentPath !== '/' && (
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={handleGoBack}
                            sx={{ mt: 2 }}
                        >
                            返回上级
                        </Button>
                    )}
                </Grid>
            </Grid>


            {/* 文件夹列表 */}
            <Box sx={{ mt: 2 }}>
                {directoryData.directories.map((dir, index) => (
                    <Button
                        key={`dir-${index}`}
                        startIcon={<FolderIcon />}
                        onClick={() => handleEnterFolder(dir)}
                        component='label'
                    >
                        {dir}/
                    </Button>
                ))}

                {/* 文件列表 */}
                {directoryData.files.map((file, index) => (
                    <Button
                        key={`file-${index}`}
                        startIcon={<InsertDriveFileIcon />}
                        href={pathJoin(currentUrl, file)}
                        target="_blank"
                        rel="noopener"
                    >
                        {file}
                    </Button>
                ))}
            </Box>
        </Box>
    )
}

export default FirmwareViewer