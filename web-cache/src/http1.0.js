
    var cp = require('child_process');

    var http = require("http"),
        fs = require("fs"),
        { resolve } = require("path");

    // 获取文件内容
    function getFileContent(url, req, res) {
        if (fs.existsSync(url)) {
            const readStream = fs.createReadStream(url);

            /**
             * 配置强缓存 10s
             * 注意点: 
             *  1> pragma会使得缓存无效
             *  2> index.html页面无法生效
             *  3> 本地时间差异会使得expires产生bug
             */
            res.setHeader("expires", new Date(Date.now() + 10 * 1000).toUTCString());
            // res.setHeader("pragma", "no-cache");
            
            readStream.pipe(res);
            res.statusCode = 200;
        }else {
            res.end(null);
        };
    };

    // 创建服务器
    var server = http.createServer((req, res) => {
        var { url } = req;
        if (url === "/") {
            var path = resolve(__dirname, "../assets/index.html");
            var file = fs.readFileSync(path, "utf-8");
                fs.writeFileSync(path, file.replace(/<h1>.*<\/h1>/g, "<h1>http版本: http1.0</h1>"));

            getFileContent(
                path,
                req,
                res
            );
        }else if (url.startsWith("/js")) {
            getFileContent(
                resolve(__dirname, "../assets"+url),
                req,
                res
            );
        }else if (url.startsWith("/img")) {
            getFileContent(
                resolve(__dirname, "../assets"+url),
                req,
                res
            );
        }else if (url === "/favicon.ico") {
            res.end(null);
        }else {
            getFileContent(
                resolve(__dirname, "../assets/404.html"),
                req,
                res
            );
        };
    }).listen(8888);

    // 打开当前服务
    cp.exec("start http://localhost:8888");
    
