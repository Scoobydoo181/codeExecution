# codeExecution
An implementation of a remote code execution environment like those found in LeetCode or HackerRank

The basic data flow is as follows:
    1. Docker containers are started for each supported programming language
    2. Code and language is entered into the HTML form on the frontend
    3. An HTTP request sends the data to the web server
    4. The code is written to a file with the appropriate file extension
    5. child_process.exec is invoked to copy the file to the appropriate container 
    6. child_process.exec runs the file within the container and sends stdout to the function in a callback
    7. Function output is sent to the frontend in the HTTP response
    8. The local file is deleted
    9. JavaScript in the frontend sets the value of the output box to be the code's output
