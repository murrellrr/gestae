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
 * @author Robert R Murrell
 * @license MIT
 * @copyright 2024 KRI, LLC
 */
export class URITree {
    private readonly _leafs: string[];
    private          _leaf:  string | undefined;
    private          _index: number = 0;

    constructor(uri: string) {
        // Ensure _nodes never contains empty strings
        this._leafs = uri.split("/").map(node => node.trim()).filter(node => node.length > 0);
        this._index = 0;
        this._leaf  = this._leafs.length > 0 ? this._leafs[this._index] : undefined;
    }

    /**
     * @description Gets the current leaf on the tree.
     * @returns The current leaf on the tree or undefined if no more nodes exist.
     */
    get leaf(): string | undefined {
        if(!this._leaf) return undefined;
        return this._leaf;
    }

    /**
     * @description Advanced the inde on the tree and returns the next node.
     * @returns The next node in the tree or undefined if no more nodes exist.
     */
    get next(): string | undefined {
        if(!this.hasNext) return undefined;
        this._leaf = this._leafs[++this._index] ?? undefined;
        return this._leaf;
    }

    /**
     * @description Looks at the next path node in the tree without advancing the index.
     * @returns The next path node in the tree or undefined if no more nodes exist.
     */
    get peek(): string | undefined {
        const _peekIndex = this._index + 1;
        if(_peekIndex < this._leafs.length)
            return this._leafs[_peekIndex];
        return undefined; // No more nodes to return
    }

    /**
     * @description Determines if the current node is the target node in question be determining
     *              if there are any remaining nodes on the tree.
     * @returns True if the current node is the target node, false otherwise.
     * @see URITree#hasNext
     */
    get target(): boolean {
        return !this.hasNext;
    }

    /**
     * @description Resets the index of the tree to the root node.
     */
    reset(): void {
        this._index = 0;
        this._leaf = this._leafs.length > 0 ? this._leafs[this._index] : undefined;
    }

    get hasNext(): boolean {
        return this._index + 1 < this._leafs.length; // Ensure a next element exists
    }
}