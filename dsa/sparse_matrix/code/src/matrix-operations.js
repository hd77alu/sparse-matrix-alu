const fs = require('fs');
const readline = require('readline');

class SparseMatrix {
    constructor(numRows, numCols) {
        this.numRows = numRows;
        this.numCols = numCols;
        this.data = {}; // Non-zero elements data
    }

    static fromFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // line splitting and trimming
        let lines = [];
        let currentLine = '';
        for (let i = 0; i < content.length; i++) {
            const char = content[i];
            if (char === '\n' || char === '\r') {
                if (trimSpaces(currentLine).length > 0) {
                    lines.push(trimSpaces(currentLine));
                }
                currentLine = '';
                // line endings (\r\n)
                if (char === '\r' && content[i + 1] === '\n') i++;
            } else {
                currentLine += char;
            }
        }
        if (trimSpaces(currentLine).length > 0) {
            lines.push(trimSpaces(currentLine));
        }

        // Check rows and cols format
        if (!startsWith(lines[0], 'rows=') || !startsWith(lines[1], 'cols=')) {
            throw new Error('Input file has wrong format');
        }
        const numRows = parseInt(lines[0].slice(5));
        const numCols = parseInt(lines[1].slice(5));
        if (isNaN(numRows) || isNaN(numCols)) {
            throw new Error('Input file has wrong format');
        }
        const matrix = new SparseMatrix(numRows, numCols);

        // Check parenthesis
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i];
            if (line[0] !== '(' || line[line.length - 1] !== ')') {
                throw new Error('Input file has wrong format');
            }
            // Remove parenthesis and split
            const inside = line.slice(1, -1);
            let parts = [];
            let part = '';
            for (let j = 0; j < inside.length; j++) {
                if (inside[j] === ',') {
                    parts.push(trimSpaces(part));
                    part = '';
                } else {
                    part += inside[j];
                }
            }
            parts.push(trimSpaces(part));
            if (parts.length !== 3) throw new Error('Input file has wrong format');
            if (!SparseMatrix.isInteger(parts[0]) || !SparseMatrix.isInteger(parts[1]) || !SparseMatrix.isInteger(parts[2])) {
                throw new Error('Input file has wrong format');
            }
            const row = parseInt(parts[0]);
            const col = parseInt(parts[1]);
            const value = parseInt(parts[2]);
            matrix.setElement(row, col, value);
        }
        return matrix;
    }

    static isInteger(str) {
        // Check if the string is empty
        if (str.length === 0) return false;

        // Handle optional sign at the beginning
        let start = 0;
        if (str[0] === '-' || str[0] === '+') {
            start = 1;
        }

        // Ensures there is at least one digit
        if (start === str.length) return false;

        // Check that every remaining character is a digit
        for (let i = start; i < str.length; i++) {
            const char = str[i];
            if (char < '0' || char > '9') {
                return false;
            }
        }
        return true;
    }
// Method to get the matrix elements
    getElement(row, col) {
        const key = `${row},${col}`;
        return this.data[key] !== undefined ? this.data[key] : 0;
    }

    setElement(row, col, value) {
        const key = `${row},${col}`;
        if (value === 0) {
            delete this.data[key];
        } else {
            this.data[key] = value;
        }
    }

    add(other) {
        // Check if the matrices are eligible for addition
        if (this.numRows !== other.numRows || this.numCols !== other.numCols) {
            throw new Error('Matrix dimensions do not match for addition');
        }
        const result = new SparseMatrix(this.numRows, this.numCols);
        // Copy the matrix
        for (const key in this.data) {
            result.data[key] = this.data[key];
        }
        // perform addition
        for (const key in other.data) {
            const val = result.data[key] !== undefined ? result.data[key] : 0;
            result.data[key] = val + other.data[key];
            if (result.data[key] === 0) delete result.data[key];
        }
        return result;
    }

    subtract(other) {
        // Check if the matrices are eligible for subtraction
        if (this.numRows !== other.numRows || this.numCols !== other.numCols) {
            throw new Error('Matrix dimensions do not match for subtraction');
        }
        const result = new SparseMatrix(this.numRows, this.numCols);
        // Copy the matrix
        for (const key in this.data) {
            result.data[key] = this.data[key];
        }
        // Subtract other's data
        for (const key in other.data) {
            const val = result.data[key] !== undefined ? result.data[key] : 0;
            result.data[key] = val - other.data[key];
            if (result.data[key] === 0) delete result.data[key];
        }
        return result;
    }

      multiply(other) {
        // Check if the matrices are eligible for multiplication
        if (this.numCols !== other.numRows) {
            throw new Error('Matrix dimensions do not match for multiplication');
        }
        const result = new SparseMatrix(this.numRows, other.numCols);

        // Mapping through the values
        const rowMap = {};
        for (const key in other.data) {
            const [rowY, colY] = key.split(',').map(Number);
            if (!rowMap[rowY]) rowMap[rowY] = [];
            rowMap[rowY].push([colY, other.data[key]]);
        }

        // For each nonzero in this matrix (X)
        for (const keyX in this.data) {
            const [rowX, colX] = keyX.split(',').map(Number);
            const valX = this.data[keyX];
            // Multiply with nonzeros in the corresponding row of Y
            if (rowMap[colX]) {
                for (let i = 0; i < rowMap[colX].length; i++) {
                    const [colY, valY] = rowMap[colX][i];
                    const prev = result.getElement(rowX, colY);
                    result.setElement(rowX, colY, prev + valX * valY);
                }
            }
        }
        return result;
    }
// Method to convert the matrix to a string representation
    toString() {
        let result = `rows=${this.numRows}\ncols=${this.numCols}\n`;
        for (const key in this.data) {
            const [row, col] = key.split(',');
            result += `(${row}, ${col}, ${this.data[key]})\n`;
        }
        return result;
    }
}

// Function to trim whitespace from both ends of a string
function trimSpaces(str) {
    let start = 0, end = str.length - 1;
    while (start <= end && (str[start] === ' ' || str[start] === '\t')) start++;
    while (end >= start && (str[end] === ' ' || str[end] === '\t')) end--;
    return str.substring(start, end + 1);
}

// Function to check the string
function startsWith(str, prefix) {
    if (str.length < prefix.length) return false;
    for (let i = 0; i < prefix.length; i++) {
        if (str[i] !== prefix[i]) return false;
    }
    return true;
}

// User Interface
async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function ask(query) {
        return new Promise(resolve => rl.question(query, resolve));
    }

    try {
        let op;
        // Loop until a valid operation is selected
        while (true) {
            op = await ask('Select an operation:\n 1.addition\n 2.subtraction\n 3.multiplication\n Your choice: ');
            if (['1', '2', '3'].includes(op)) break;
            console.log('invalid option, please select a number 1, 2 or 3');
        }
        const file1 = await ask('Enter your first matrix file pathaway: ');
        const file2 = await ask('Enter your second matrix file pathway: ');
        // load matrices files
        let mx1, mx2;
        try {
            mx1 = SparseMatrix.fromFile(file1);
            mx2 = SparseMatrix.fromFile(file2);
        } catch (e) {
            console.error(e.message);
            rl.close();
            return;
        }
        // display matrix result
        let result;
        try {
            switch (op) {
                case '1':
                    result = mx1.add(mx2);
                    break;
                case '2':
                    result = mx1.subtract(mx2);
                    break;
                case '3':
                    result = mx1.multiply(mx2);
                    break;
                default:
                    rl.close();
                    return;
            }
        } catch (e) {
            console.error(e.message);
            rl.close();
            return;
        }

        console.log('Result Matrix:');
        console.log(result.toString());
    } finally {
        rl.close();
    }
}

if (require.main === module) {
    main();
}
// Export the SparseMatrix for further testing
module.exports = { SparseMatrix };