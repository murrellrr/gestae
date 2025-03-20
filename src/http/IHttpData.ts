import { AbstractHttpRequestBody } from "./AbstractHttpRequestBody";
import { AbstractHttpResponseBody } from "./AbstractHttpResponseBody";



export interface IHttpData {
    requestBody:  AbstractHttpRequestBody<any>;
    responseBody: AbstractHttpResponseBody<any>;
}