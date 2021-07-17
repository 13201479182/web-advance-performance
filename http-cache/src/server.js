
    const http = require("http");
    const fs = require("fs");
    const { resolve } = require("path");
    const crypto = require("crypto");

    function getHash(url) {
        const content = fs.readFileSync(url, "utf-8");
        return crypto.createHash("sha1").update(content).digest("hex");
    };

    function getFileContent(path, req, res, basicPath="assets/") {
        const filePath = basicPath + path;
        if ( fs.existsSync(filePath) ) {
            // 在文件存在情况下获取文件内容
            const content = fs.readFileSync(filePath);
            // 走缓存策略
            if (req || res) {
                // 进行协商缓存的略制定
                res.setHeader("Cache-Control", "no-cache");

                // 第一种: last-modified && if-modified-since的实现方式(基于文件修改时间)
                // const fileStatus = fs.statSync(filePath);
                // const fileModifyTime = new Date(fileStatus.mtime).getTime();
                // const lastModifyTime = req.headers["if-modified-since"];
                // // 走协商策略
                // if (fileModifyTime == lastModifyTime) {
                //     res.statusCode = 304;
                //     res.end();
                // }else {
                //     res.setHeader("last-modified", fileModifyTime);
                //     res.end(content);
                // };

                // 第二种: etag && if-none-match的实现方式(基于文件内容)
                const preHash = req.headers["if-none-match"];
                const temHash = getHash(filePath);
                if (preHash && preHash==temHash) {
                    res.statusCode = 304;
                    res.end();   
                }else {
                    res.setHeader("etag", temHash);
                    res.end(content);
                };
            }else {
                return content;
            };
        }else {
            res.statusCode = 404;
            res.end();
        };
    };
    
    const server = http.createServer(
        (req, res) => {
            const { url } = req;
            if (url === "/") {
                // 读取html并返回
                res.end( getFileContent("index.html") );
            }else if(url.startsWith("/img")) {
                // 图片资源
                getFileContent(url, req, res);
            }else if(url.startsWith("/js")) {
                /***
                 * js静态文件
                 * 默认情况: 客户端每次请求浏览器都会响应资源,所以必须进行http优化(缓存)
                 */
                // http1.0 设置5秒的强缓存(优先级低)
                // res.setHeader("expires", new Date(Date.now() + 5*1000).toUTCString());
                
                // http1.1 设置20秒的强缓存(优先级高)
                // res.setHeader("Cache-Control", "max-age=20");

                // 不走强缓存,通过此字段设定就会走协商缓存
                getFileContent(url, req, res);
            }else if(url === "favicon.ico") {
                res.end();
            }else {
                res.end( getFileContent("404.html") );
            };      
        }
    ).listen(30000);