
    var cp = require('child_process');

    var http = require("http"),
        fs = require("fs"),
        { resolve } = require("path"),
        crypto = require("crypto");

    // 获取文件哈希值
    function getFileHash(url) {
        var file = fs.readFileSync(url);
        return crypto.createHash("sha1").update(file).digest("hex");
    };

    // 获取文件内容
    function getFileContent(url, req, res) {
        if (fs.existsSync(url)) {
            /**
             * 强缓存实现方法
             * 注意点: index页面无法生效
             */
            // res.setHeader("cache-control", `max-age=${10 * 1000}`);

            /**
             * 协商缓存实现方式
             * 关键字段: 
             *   基于修改时间: last-modified & if-modified-since
             *   基于文件内容: etag & if-none-match
             *    
             * 注意点: index.html页面可以生效
             */
            res.setHeader("cache-control", "no-cache");

            // 基于修改时间的实现

            // 获取当次文件修改时间戳
            // var tempTime = fs.statSync(url).mtime;
            //     tempTime = new Date(tempTime).getTime();
            // var lastTime = req.headers["if-modified-since"];
            // if (tempTime != lastTime) {
            //     const readStream = fs.createReadStream(url);
            //     res.setHeader("last-modified", tempTime);   
            //     readStream.pipe(res);     
            // }else {
            //     res.statusCode = 304;
            //     res.end();
            // }; 

            // 基于修改内容的实现
            var tempHash = getFileHash(url);
            var lastHash = req.headers["if-none-match"];
            if (tempHash != lastHash) {
                const readStream = fs.createReadStream(url);
                res.setHeader("etag", tempHash);   
                readStream.pipe(res);
                res.statusCode = 200;
            }else {
                res.statusCode = 304;
                res.end();
            };
        }else {
            res.end(null);
        };
    };

    // 创建服务器
    var server = http.createServer((req, res) => {
        var { url } = req;
        if (url === "/") {
            // 修改文件内容
            var path = resolve(__dirname, "../assets/index.html");
            var file = fs.readFileSync(path, "utf-8");
                fs.writeFileSync(path, file.replace(/<h1>.*<\/h1>/g, "<h1>http版本: http1.1</h1>"));

            getFileContent(
                resolve(__dirname, path),
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
    
    // 每10秒变更文件内容启用协商缓存
    var changeCount = 0;
    setInterval(() => {
        changeCount++;
        var path = resolve(__dirname, "../assets/js/test.js");
        var file = fs.readFileSync(path, "utf-8");
        fs.writeFileSync(path, file.replace(/changeFlag.*$/, `changeFlag: ${changeCount}"`));
    }, 10000);
