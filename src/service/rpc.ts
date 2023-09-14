/*
错误信息 参考：https://www.jsonrpc.org/specification#error_object
| code      |   message          | meaning |
| -32700    |   Parse error      | Invalid JSON was received by the server.An error occurred on the server while parsing the JSON text.  |
| -32600    |   Invalid Request  | The JSON sent is not a valid Request object.  |
| -32601    |   Method not found | The method does not exist / is not available.  |
| -32602    |   Invalid params   | Invalid method parameter(s).  |
| -32603    |   Internal error   | Internal JSON-RPC error.  |
| -32000 to -32099   |   Server error        | Reserved for implementation-defined server-errors.  |
*/
export default class JSONRPC {
  version: string = "2.0";

  errorMsg = {
    [-32700]: "Parse Error.",
    [-32600]: "Invalid Request.",
    [-32601]: "Method Not Found.",
    [-32602]: "Invalid Params.",
    [-32603]: "Internal Error.",
  };

  methods = {};

  normalize(rpc, obj) {
    obj.id = rpc && typeof rpc.id === "number" ? rpc.id : null;
    obj.jsonrpc = this.version;
    //如果错误根据错误不存在错误信息的话代码获取错误信息
    if (obj.error && !obj.error.message) {
        obj.error.message = this.errorMsg[obj.error.code] || obj.error.message;
    }
    return obj;
  }

  validRequest(rpc) {
    return (
      rpc.jsonrpc === this.version &&
      (typeof rpc.id === "number" || typeof rpc.id === "string") &&
      typeof rpc.method === "string"
    );
  }

  /**
   * JSONRPC 请求处理
   * @param  {Object} rpc
   * @param  {Function} response 响应回调
   */
  handleRequest(rpc, response) {
    //版本与一些参数验证
    if (!this.validRequest(rpc)) {
      return response(this.normalize(rpc, { error: { code: -32600 } })); //请求协议不规范
    }

    //函数查找
    const method = this.methods[rpc.method];
    if (typeof method !== "function") {
      return response(this.normalize(rpc, { error: { code: -32601 } })); // 函数或方法未找到
    }
    
    // 调用函数将其执行结果作为响应结果返回客户端
    try {
      response(this.normalize(rpc, { result: method.apply(this, rpc.params) }));
    } catch (error: unknown) {
      if (error instanceof Error) {
        response(this.normalize(rpc, { error: { code: -32000, message: error.message } }));
      } else {
        response(
          this.normalize(rpc, { error: { code: 0, message: "unknown error" } })
        );
      }
    }
  }
}
