import { createServer } from "http";
import url from "url";
import JSONPRC from "./rpc";

const HOST = "localhost";
const PORT = 8080;
const RPC = new JSONPRC();
// 添加方法
RPC.methods = {
  rpcDivide(a, b) {
    if (b === 0) throw Error("Not allow 0");
    return a / b;
  },
};
// 路由设计，供客户端调用
const routes = {
  "/rpc-divide": (request, response) => {
    if (request.method === "POST") {
      let data = "";
      request.setEncoding("utf8");
      request.addListener("data", (chunk) => {
        data += chunk;
      });
      request.addListener("end", () => {
        RPC.handleRequest.call(RPC, JSON.parse(data), (obj) => {
          const body = JSON.stringify(obj);
          response.writeHead(200, {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
          });
          response.end(body);
        });
      });
    } else {
      response.end("hello nodejs http server");
    }
  },
};

const server = createServer((request, response) => {
  // 解析请求，包括文件名
  const pathname = url.parse(request.url || "").pathname || "";
  const route = routes[pathname];
  if (route) {
    route(request, response);
  } else {
    response.end("hello nodejs http server");
  }
});

server.listen(PORT, HOST, 0, () => {
  console.log(`server is listening on http://${HOST}:${PORT} ...`);
});
