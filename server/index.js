const express = require('express')


const PORT = process.env.PORT || 5000
const cors = require('cors')
const app = express()
const WSServer = require('express-ws')(app)
const aWss = WSServer.getWss()
const fs = require('fs')
const path = require('path')

app.use(cors())
app.use(express.json())

app.ws('/', (ws, req) => {
    console.log('ПОДКЛЮЧЕНИЕ УСТАНОВЛЕНО')
    // ws.send('ты подключился')
    ws.on('message', (msg) => {
        msg = JSON.parse(msg)
        switch (msg.method) {
            case'connection': {
                connectionHandler(ws, msg)
                break
            }
            case 'message': {
                messageHandler(ws, msg)
                break
            }
            case 'draw': {
                broadcastDraw(ws, msg)
                break
            }
        }
    })
})

app.post('/image', (req, res) => {
    try {
        const data = req.body.img.replace('data:image/png;base64,', '')
        fs.writeFileSync(path.resolve(__dirname, 'files', `${req.query.id}.jpg`), data, "base64")
        return res.status(200).json({message: 'загружено'})
    } catch (e) {
        console.log(e)
        return res.status(500).json('error')
    }
})
app.get('/image', (req, res) => {
    try {
        const file = fs.readFileSync(path.resolve(__dirname, 'files', `${req.query.id}.jpg`))
        const data="data:image/png;base64," + file.toString('base64')
        return res.status(200).json(data)
    } catch (e) {
        console.log(e)
        return res.status(500).json('error')
    }
})


app.listen(PORT, () => console.log(`server started on PORT ${PORT}`))

const connectionHandler = (ws, msg) => {
    ws.id = msg.id
    aWss.clients.forEach(client => {

        if (client.id === msg.id) {
            client.send(JSON.stringify(msg))
        }
    })
}
const messageHandler = (ws, msg) => {
    if (ws.id === msg.id) broadcastConnection(ws, msg)
}

const broadcastConnection = (ws, msg) => {
    aWss.clients.forEach(client => {
        if (client.id === msg.id) {
            client.send(`Пользователь ${msg.userName} подключился`)
        }
    })
}
const broadcastDraw = (ws, msg) => {
    aWss.clients.forEach(client => {

        if (client.id === msg.id) {
            client.send(JSON.stringify(msg))
        }
    })
}