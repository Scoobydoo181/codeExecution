import express from 'express'
import { exec } from 'child_process'
import path from 'path'
import fs from 'fs'

/* 
    Data flow:
    1. Code and language is entered into the HTML form on the frontend
    2. An HTTP request sends the data to the web server
    3. The code is written to a file with the appropriate file extension
    4. child_process.exec is invoked to copy the file to the appropriate container 
    5. child_process.exec runs the file within the container and sends stdout to the function in a callback
    6. Function output is sent to the frontend in the HTTP response
    7. The local file is deleted
    8. JavaScript in the frontend sets the value of the output box to be the code's output
*/

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))

startContainers()

app.get('/', (req, res) => {
    res.sendFile(path.resolve() + '/index.html')
})

app.post('/runcode', (req, res) => {
    const ext = req.body.ext
    let code = req.body.code

    const filename = 'file_' + Date.now() + ext
    if(ext === '.java') 
        code = `public class ${filename.slice(0, filename.length - 5)} {\n${code} \n}`
    
    fs.writeFile(filename, code, (err) => { if(err) throw err})

    let containerName
    let runCommand
    switch (ext) {
        case '.java':
            containerName = 'java'
            runCommand = `javac ${filename} && docker exec java java ${filename.replace('.java', '')}`
            break;
        case '.py':
            containerName = 'python'
            runCommand = `python ${filename}`
            break;
        case '.js':
            containerName = 'node'
            runCommand = `node ${filename}`
            break;
    }

    exec(`docker cp ./${filename} ${containerName}:${filename} && docker exec ${containerName} ${runCommand}`, 
      (err, stdout, stderr) => {
        if (err) throw err

        fs.unlink(filename, (err) => {if(err) throw err})
        res.send({output: stdout || stderr})

        exec(`docker exec ${containerName} rm ${filename}`, (err, stdout, stderr) => {
            if (err) throw err
        })
    })

})

function startContainers() {
    exec("docker ps", (err, stdout, stderr) => {
        if (err) throw err

        if (!stdout.includes("java")) exec("docker run -dt --name java openjdk:alpine", (err, stdout, stderr) => {
            if (err) throw err;
            console.log(stdout)
        });
        //if (!stdout.includes("gcc")) exec("docker run -d --name gcc gcc");
        if (!stdout.includes("node")) exec("docker run -dt --name node node:alpine", (err, stdout, stderr) => {
            if (err) throw err;
            console.log(stdout)
        });
        if (!stdout.includes("python")) exec("docker run -dt --name python python:slim", (err, stdout, stderr) => {
            if (err) throw err;
            console.log(stdout)
        });
    });
}

app.listen(process.env.port, () => {
    console.log(`Listening on port ${process.env.port}`)
})