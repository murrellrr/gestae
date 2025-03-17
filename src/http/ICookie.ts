/*
 *  Copyright (c) 2024, KRI, LLC.
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

/**
 * @description Cookie is an interface that represents an HTTP cookie. This interface is 
 *              used for both inbound and outbound cookies.
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export interface ICookie {
    name: string;
    value: string;
    expires?: moment.Moment;
    maxAge?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
}

/**
 * @description createCookieString Creates a cookie set-cookies header string from a Cookie object.
 * @param cookie 
 * @returns 
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export const createCookieString = (cookie: ICookie): string => {
    const parts: string[] = [];
  
    // Start with name=value
    parts.push(`${cookie.name}=${encodeURIComponent(cookie.value)}`);
  
    // Optional attributes
    if(cookie.expires)
      parts.push(`Expires=${cookie.expires.toDate().toUTCString()}`);
  
    if(cookie.maxAge !== undefined)
      parts.push(`Max-Age=${cookie.maxAge}`);
  
    if(cookie.domain)
      parts.push(`Domain=${cookie.domain}`);
  
    if(cookie.path)
      parts.push(`Path=${cookie.path}`);
  
    if(cookie.secure)
      parts.push("Secure");
  
    if(cookie.httpOnly)
      parts.push("HttpOnly");
  
    if(cookie.sameSite)
      parts.push(`SameSite=${cookie.sameSite}`);
  
    return parts.join("; ");
  }