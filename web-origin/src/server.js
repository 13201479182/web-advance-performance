
    const http = require("http"),
          fs = require("fs"),
          cp = require("child_process"),
          path = require("path");

    const server1 = http.createServer((req, res) => {
        const { url, headers } = req;

        if (url === "/") {
            console.log(headers.cookie);
            const readStream = fs.createReadStream(path.resolve(__dirname, "../assets/index.html"));
            readStream.pipe(res);
        }else { 
            res.end(null);
        };
    }).listen(8000);

    const server2 = http.createServer((req, res) => {
        const { url, method } = req;
    
        // 允许http://localhost:8000跨域访问
        res.setHeader("Access-Control-Allow-Origin", "http://localhost:8000");
        // 当前域允许跨域cookie
        res.setHeader("Access-Control-Allow-Credentials", "true");

        // 放行预检请求
        if (method==="OPTIONS" && url==="/getUserInformation") {
            res.writeHead(200, {
                "Access-Control-Allow-Headers": "x-token"
            });
            res.end();
        };
        
        if (method==="GET" && url==="/getUserInformation") {
            // server2设置cookie
            res.setHeader("Set-Cookie", "server=server2-set");
            res.setHeader("Content-type", "text/plain;charset=utf-8;");
            res.end(
                JSON.stringify({
                    name: "刘汇源",
                    like: "敲代码,看动漫,打游戏"
                })
            );
        }else {
            res.end(null);
        };
    }).listen(8001);

    cp.exec("start http://localhost:8000");
