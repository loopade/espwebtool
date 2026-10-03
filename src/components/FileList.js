import React from 'react'
import PropTypes from 'prop-types'

import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload'
import AddBoxIcon from '@mui/icons-material/AddBox'
import DeleteIcon from '@mui/icons-material/Delete'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import Tooltip from '@mui/material/Tooltip'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'

import styles from './FileList.module.css'

import { defaultFiles, saveFiles } from '../lib/esp'

const FileList = (props) => {
    const addFile = () => {
        props.setUploads([...props.uploads, {
            offset: 0,
            enabled: true,
        }])
    }

    const reset = () => {
        const newUploads = defaultFiles(props.chipName)

        saveFiles(newUploads)
        props.setUploads(newUploads)
    }

    const uploadFile = (e, i) => {
        const newUploads = [...props.uploads]

        newUploads[i] = {
            ...newUploads[i],
            fileName: e.target.files[0].name,
            obj: e.target.files[0],
            enabled: true,
        }

        saveFiles(newUploads)
        props.setUploads(newUploads)
    }

    const setOffset = (index, newOffset) => {
        const newUploads = [...props.uploads]
        newUploads[index] = {
            ...props.uploads[index],
            offset: newOffset
        }

        saveFiles(newUploads)
        props.setUploads(newUploads)
    }

    const deleteFile = (index) => {
        const file = props.uploads[index]
        const newUploads = [...props.uploads]

        if (file.fileName) {
            newUploads[index] = {
                ...newUploads[index],
                fileName: undefined,
                obj: undefined,
            }
        } else {
            newUploads.splice(index, 1)
        }

        saveFiles(newUploads)
        props.setUploads(newUploads)
    }

    const onlyHex = (e) => {
        const re = /[0-9a-fA-F]+/g
        if (!re.test(e.key)) e.preventDefault()
    }

    const setEnabled = (index, enabled) => {
        const newUploads = [...props.uploads]
        newUploads[index] = { ...newUploads[index], enabled }
        saveFiles(newUploads)
        props.setUploads(newUploads)
    }

    const offsetHint = (offset) => {
        const normalized = `${offset}`.toLowerCase().replace(/^0x/, '')
        const hints = {
            '1000': 'ESP32 引导程序（bootloader.bin）',
            '8000': 'ESP32 分区表（partitions.bin）',
            'e000': 'ESP32 二级引导配置（boot_app0.bin）',
            '10000': 'ESP32 应用固件（通常是最大的 .bin）',
            '0': 'ESP8266 合并固件，或需要从 0x0 开始的完整镜像',
        }
        return hints[normalized] || '请输入该固件要求的十六进制地址'
    }

    return (
        <Box textAlign='center' className={styles.box}>
            <Typography variant="h6" sx={{ my: 2 }} textAlign='left'>
                固件更新
            </Typography>
            <Typography variant='body2' color='text.secondary' textAlign='left' sx={{ mb: 1 }}>
                ESP32 默认地址：0x1000 引导程序，0x8000 分区表，0xE000 boot_app0，0x10000 应用固件；ESP8266 通常使用 0x0 的合并固件。
            </Typography>
            {props.uploads.map((file, i) =>
                <Grid container spacing={0} className={styles.fileItem} key={i}>
                    {/* Offset */}
                    <Grid item xs={2} className={styles.fileOffset}>
                        <Tooltip title={offsetHint(file.offset)} placement='top' arrow>
                            <TextField
                                label='0x'
                                variant='outlined'
                                size='small'
                                value={file.offset}
                                title={offsetHint(file.offset)}
                                onKeyDown={onlyHex}
                                onChange={(e) => setOffset(i, e.target.value)}
                            />
                        </Tooltip>
                    </Grid>

                    {/* File Name */}
                    <Grid item xs={7}>
                        {file.fileName ?
                            <Typography className={styles.fileName}>
                                {file.fileName}
                            </Typography>
                            :
                            <Button variant='outlined' color='primary' component='label' endIcon={<DriveFolderUploadIcon />}>
                                选择文件
                                <input
                                    type='file'
                                    hidden
                                    onChange={(e) => uploadFile(e, i)}
                                />
                            </Button>
                        }
                    </Grid>

                    {/* Enable/disable this image */}
                    <Grid item xs={2}>
                        <FormControlLabel
                            label='烧录'
                            control={
                                <Checkbox
                                    size='small'
                                    checked={file.enabled !== false}
                                    disabled={!file.fileName}
                                    onChange={(e) => setEnabled(i, e.target.checked)}
                                />
                            }
                        />
                    </Grid>

                    {/* Delete */}
                    <Grid item xs={1}>
                        <IconButton
                            color='error'
                            onClick={() => deleteFile(i)}
                        >
                            {file.fileName ?
                                <HighlightOffIcon />
                                :
                                <DeleteIcon />
                            }
                        </IconButton>
                    </Grid>
                </Grid>
            )}

            {/* Add File */}
            <Grid container spacing={.5}>
                <Grid item xs={6} sx={{ textAlign: 'left' }}>
                    <Button color='error' component='label' size='large' onClick={reset} endIcon={<RestartAltIcon />}>
                        重置
                    </Button>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Button color='primary' component='label' size='large' onClick={addFile} endIcon={<AddBoxIcon />}>
                        添加
                    </Button>
                </Grid>
            </Grid>
        </Box>
    )
}

FileList.propTypes = {
    uploads: PropTypes.array,
    setUploads: PropTypes.func,
    chipName: PropTypes.string,
}

export default FileList
