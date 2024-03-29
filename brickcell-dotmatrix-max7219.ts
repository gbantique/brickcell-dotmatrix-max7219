/**
 * MakeCode editor extension for single or multiple MAX7219 8x8 matrix LED modules
 * by Alan Wang
 */

/**
 * Brickcell Development Kit
 */
//% color="#FFBF00" icon="\uf12e" weight=70
namespace Brickcell {
    /**
     * MAX7219 8x8 Dot Matrix Display
     */
  export class MAX7219 {
    private _NOOP: number;        // no-op (do nothing, doesn't change current status)
    private _DIGIT: number[];     // digit (LED column)
    private _DECODEMODE: number;  // decode mode (1=on, 0-off; for 7-segment display on MAX7219, no usage here)
    private _INTENSITY: number;   // intensity (LED brightness level, 0-15)
    private _SCANLIMIT: number;   // scan limit (number of scanned digits)
    private _SHUTDOWN: number;    // turn on (1) or off (0)
    private _DISPLAYTEST: number; // force all LEDs light up, no usage here

    private _pinCS: DigitalPin;      // LOAD pin, 0=ready to receive command, 1=command take effect
    private _matrixNum: number;       // number of MAX7219 matrix linked in the chain
    private _displayArray: number[];  // display array to show accross all matrix
    private _rotation: number;        // rotate matrix display for 4-in-1 modules
    private _reversed: boolean;       // reverse matrix display order for 4-in-1 modules

    // ASCII fonts borrowed from https://github.com/lyle/matrix-led-font/blob/master/src/index.js
    private font: string[];
    private font_matrix: number[][];
 
    constructor() {
      this._NOOP = 0;
      this._DIGIT = [1, 2, 3, 4, 5, 6, 7, 8];
      this._DECODEMODE = 9;
      this._INTENSITY = 10;
      this._SCANLIMIT = 11;
      this._SHUTDOWN = 12;
      this._DISPLAYTEST = 15;

      this._pinCS = DigitalPin.P16;
      this._matrixNum = 1;
      this._displayArray = [];
      this._rotation = 0;
      this._reversed = false;

      this.font = [" ", "!", "\"", "#", "$", "%", "&", "\'", "(", ")",
          "*", "+", ",", "-", ".", "/",
          "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
          ":", ";", "<", "=", ">", "?", "@",
          "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
          "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
          "[", "\\", "]", "_", "`",
          "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l",
          "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
          "{", "|", "}", "~", "^"];
      this.font_matrix = [
          [0b00000000, 0b00000000, 0b00000000, 0b00000000],
          [0b01011111, 0b00000000],
          [0b00000011, 0b00000000, 0b00000011, 0b00000000],
          [0b00010100, 0b00111110, 0b00010100, 0b00111110, 0b00010100, 0b00000000],
          [0b00100100, 0b01101010, 0b00101011, 0b00010010, 0b00000000],
          [0b01100011, 0b00010011, 0b00001000, 0b01100100, 0b01100011, 0b00000000],
          [0b00110110, 0b01001001, 0b01010110, 0b00100000, 0b01010000, 0b00000000],
          [0b00000011, 0b00000000],
          [0b00011100, 0b00100010, 0b01000001, 0b00000000],
          [0b01000001, 0b00100010, 0b00011100, 0b00000000],
          [0b00101000, 0b00011000, 0b00001110, 0b00011000, 0b00101000, 0b00000000],
          [0b00001000, 0b00001000, 0b00111110, 0b00001000, 0b00001000, 0b00000000],
          [0b10110000, 0b01110000, 0b00000000],
          [0b00001000, 0b00001000, 0b00001000],
          [0b01100000, 0b01100000, 0b00000000],
          [0b01100000, 0b00011000, 0b00000110, 0b00000001, 0b00000000],
          [0b00111110, 0b01000001, 0b01000001, 0b00111110, 0b00000000],
          [0b01000010, 0b01111111, 0b01000000, 0b00000000],
          [0b01100010, 0b01010001, 0b01001001, 0b01000110, 0b00000000],
          [0b00100010, 0b01000001, 0b01001001, 0b00110110, 0b00000000],
          [0b00011000, 0b00010100, 0b00010010, 0b01111111, 0b00000000],
          [0b00100111, 0b01000101, 0b01000101, 0b00111001, 0b00000000],
          [0b00111110, 0b01001001, 0b01001001, 0b00110000, 0b00000000],
          [0b01100001, 0b00010001, 0b00001001, 0b00000111, 0b00000000],
          [0b00110110, 0b01001001, 0b01001001, 0b00110110, 0b00000000],
          [0b00000110, 0b01001001, 0b01001001, 0b00111110, 0b00000000],
          [0b00010100, 0b00000000],
          [0b00100000, 0b00010100, 0b00000000],
          [0b00001000, 0b00010100, 0b00100010, 0b00000000],
          [0b00010100, 0b00010100, 0b00010100, 0b00000000],
          [0b00100010, 0b00010100, 0b00001000, 0b00000000],
          [0b00000010, 0b01011001, 0b00001001, 0b00000110, 0b00000000],
          [0b00111110, 0b01001001, 0b01010101, 0b01011101, 0b00001110, 0b00000000],
          [0b01111110, 0b00010001, 0b00010001, 0b01111110, 0b00000000],
          [0b01111111, 0b01001001, 0b01001001, 0b00110110, 0b00000000],
          [0b00111110, 0b01000001, 0b01000001, 0b00100010, 0b00000000],
          [0b01111111, 0b01000001, 0b01000001, 0b00111110, 0b00000000],
          [0b01111111, 0b01001001, 0b01001001, 0b01000001, 0b00000000],
          [0b01111111, 0b00001001, 0b00001001, 0b00000001, 0b00000000],
          [0b00111110, 0b01000001, 0b01001001, 0b01111010, 0b00000000],
          [0b01111111, 0b00001000, 0b00001000, 0b01111111, 0b00000000],
          [0b01000001, 0b01111111, 0b01000001, 0b00000000],
          [0b00110000, 0b01000000, 0b01000001, 0b00111111, 0b00000000],
          [0b01111111, 0b00001000, 0b00010100, 0b01100011, 0b00000000],
          [0b01111111, 0b01000000, 0b01000000, 0b01000000, 0b00000000],
          [0b01111111, 0b00000010, 0b00001100, 0b00000010, 0b01111111, 0b00000000],
          [0b01111111, 0b00000100, 0b00001000, 0b00010000, 0b01111111, 0b00000000],
          [0b00111110, 0b01000001, 0b01000001, 0b00111110, 0b00000000],
          [0b01111111, 0b00001001, 0b00001001, 0b00000110, 0b00000000],
          [0b00111110, 0b01000001, 0b01000001, 0b10111110, 0b00000000],
          [0b01111111, 0b00001001, 0b00001001, 0b01110110, 0b00000000],
          [0b01000110, 0b01001001, 0b01001001, 0b00110010, 0b00000000],
          [0b00000001, 0b00000001, 0b01111111, 0b00000001, 0b00000001, 0b00000000],
          [0b00111111, 0b01000000, 0b01000000, 0b00111111, 0b00000000],
          [0b00001111, 0b00110000, 0b01000000, 0b00110000, 0b00001111, 0b00000000],
          [0b00111111, 0b01000000, 0b00111000, 0b01000000, 0b00111111, 0b00000000],
          [0b01100011, 0b00010100, 0b00001000, 0b00010100, 0b01100011, 0b00000000],
          [0b00000111, 0b00001000, 0b01110000, 0b00001000, 0b00000111, 0b00000000],
          [0b01100001, 0b01010001, 0b01001001, 0b01000111, 0b00000000],
          [0b01111111, 0b01000001, 0b00000000],
          [0b00000001, 0b00000110, 0b00011000, 0b01100000, 0b00000000],
          [0b01000001, 0b01111111, 0b00000000],
          [0b01000000, 0b01000000, 0b01000000, 0b01000000, 0b00000000],
          [0b00000001, 0b00000010, 0b00000000],
          [0b00100000, 0b01010100, 0b01010100, 0b01111000, 0b00000000],
          [0b01111111, 0b01000100, 0b01000100, 0b00111000, 0b00000000],
          [0b00111000, 0b01000100, 0b01000100, 0b00101000, 0b00000000],
          [0b00111000, 0b01000100, 0b01000100, 0b01111111, 0b00000000],
          [0b00111000, 0b01010100, 0b01010100, 0b00011000, 0b00000000],
          [0b00000100, 0b01111110, 0b00000101, 0b00000000],
          [0b10011000, 0b10100100, 0b10100100, 0b01111000, 0b00000000],
          [0b01111111, 0b00000100, 0b00000100, 0b01111000, 0b00000000],
          [0b01000100, 0b01111101, 0b01000000, 0b00000000],
          [0b01000000, 0b10000000, 0b10000100, 0b01111101, 0b00000000],
          [0b01111111, 0b00010000, 0b00101000, 0b01000100, 0b00000000],
          [0b01000001, 0b01111111, 0b01000000, 0b00000000],
          [0b01111100, 0b00000100, 0b01111100, 0b00000100, 0b01111000, 0b00000000],
          [0b01111100, 0b00000100, 0b00000100, 0b01111000, 0b00000000],
          [0b00111000, 0b01000100, 0b01000100, 0b00111000, 0b00000000],
          [0b11111100, 0b00100100, 0b00100100, 0b00011000, 0b00000000],
          [0b00011000, 0b00100100, 0b00100100, 0b11111100, 0b00000000],
          [0b01111100, 0b00001000, 0b00000100, 0b00000100, 0b00000000],
          [0b01001000, 0b01010100, 0b01010100, 0b00100100, 0b00000000],
          [0b00000100, 0b00111111, 0b01000100, 0b00000000],
          [0b00111100, 0b01000000, 0b01000000, 0b01111100, 0b00000000],
          [0b00011100, 0b00100000, 0b01000000, 0b00100000, 0b00011100, 0b00000000],
          [0b00111100, 0b01000000, 0b00111100, 0b01000000, 0b00111100, 0b00000000],
          [0b01000100, 0b00101000, 0b00010000, 0b00101000, 0b01000100, 0b00000000],
          [0b10011100, 0b10100000, 0b10100000, 0b01111100, 0b00000000],
          [0b01100100, 0b01010100, 0b01001100, 0b00000000],
          [0b00001000, 0b00110110, 0b01000001, 0b00000000],
          [0b01111111, 0b00000000],
          [0b01000001, 0b00110110, 0b00001000, 0b00000000],
          [0b00001000, 0b00000100, 0b00001000, 0b00000100, 0b00000000],
          [0b00000010, 0b00000001, 0b00000010, 0b00000000]];
        }


    /**
    * Setup/reset MAX7219. 
    */
    //% block="%max7219 Setup MAX7219:|Number of matrix $num|MOSI(DIN) = $mosi|SCK(CLK) = $sck|CS(LOAD) = $cs|MISO(not used) = $miso|Rotate matrix display $rotation|Reverse printing order $reversed"
    //% blockId="MAX7219_setup"
    //% num.min=1 num.defl=1 mosi.defl=DigitalPin.P15 sck.defl=DigitalPin.P14 cs.defl=DigitalPin.P13  miso.defl=DigitalPin.P16 rotation.defl=max7219_rotation_direction.none
    //% group="1. Setup"
    //% subcategory="dotmatrix_max7219"
      public setup(num: number, mosi: DigitalPin, sck: DigitalPin, cs: DigitalPin, miso: DigitalPin, rotation: max7219_rotation_direction, reversed: boolean) {
        // set internal variables        
        this._pinCS = cs
        this._matrixNum = num
        // prepare display array (for displaying texts; add extra 8 columns at each side as buffers)
        for (let i = 0; i < (num + 2) * 8; i++)  this._displayArray.push(0)
        // set micro:bit SPI
        pins.spiPins(mosi, miso, sck)
        pins.spiFormat(8, 3)
        pins.spiFrequency(1000000)
        // initialize MAX7219s
        this._registerAll(this._SHUTDOWN, 0) // turn off
        this._registerAll(this._DISPLAYTEST, 0) // test mode off
        this._registerAll(this._DECODEMODE, 0) // decode mode off
        this._registerAll(this._SCANLIMIT, 7) // set scan limit to 7 (column 0-7)
        this._registerAll(this._INTENSITY, 15) // set brightness to 15
        this._registerAll(this._SHUTDOWN, 1) // turn on
        this.clearAll() // clear screen on all MAX7219s

        this._rotation = rotation
        this._reversed = reversed
    }

    /**
    * (internal function) write command and data to all MAX7219s
    */
    private _registerAll(addressCode: number, data: number) {
        pins.digitalWritePin(this._pinCS, 0) // LOAD=LOW, start to receive commands
        for (let i = 0; i < this._matrixNum; i++) {
            // when a MAX7219 received a new command/data set
            // the previous one would be pushed to the next matrix along the chain via DOUT
            pins.spiWrite(addressCode) // command (8 bits)
            pins.spiWrite(data) //data (8 bits)
        }
        pins.digitalWritePin(this._pinCS, 1) // LOAD=HIGH, commands take effect
    }

    /**
    * (internal function) write command and data to a specific MAX7219 (index 0=farthest on the chain)
    */
    private _registerForOne(addressCode: number, data: number, matrixIndex: number) {
        if (matrixIndex <= this._matrixNum - 1) {
            pins.digitalWritePin(this._pinCS, 0) // LOAD=LOW, start to receive commands
            for (let i = 0; i < this._matrixNum; i++) {
                // when a MAX7219 received a new command/data set
                // the previous one would be pushed to the next matrix along the chain via DOUT
                if (i == matrixIndex) { // send change to target
                    pins.spiWrite(addressCode) // command (8 bits)
                    pins.spiWrite(data) //data (8 bits)
                } else { // do nothing to non-targets
                    pins.spiWrite(this._NOOP)
                    pins.spiWrite(0)
                }
            }
            pins.digitalWritePin(this._pinCS, 1) // LOAD=HIGH, commands take effect
        }
    }

    /**
    * (internal function) rotate matrix
    */
    private _rotateMatrix(matrix: number[][]): number[][] {
        let tmp = 0
        for (let i = 0; i < 4; i++) {
            for (let j = i; j < 7 - i; j++) {
                tmp = matrix[i][j]
                if (this._rotation == max7219_rotation_direction.clockwise) { // clockwise
                    matrix[i][j] = matrix[j][7 - i]
                    matrix[j][7 - i] = matrix[7 - i][7 - j]
                    matrix[7 - i][7 - j] = matrix[7 - j][i]
                    matrix[7 - j][i] = tmp
                } else if (this._rotation == max7219_rotation_direction.counterclockwise) { // counter-clockwise
                    matrix[i][j] = matrix[7 - j][i]
                    matrix[7 - j][i] = matrix[7 - i][7 - j]
                    matrix[7 - i][7 - j] = matrix[j][7 - i]
                    matrix[j][7 - i] = tmp
                } else if (this._rotation == max7219_rotation_direction.one_eighty_degree) { // 180 degree
                    matrix[i][j] = matrix[7 - i][7 - j]
                    matrix[7 - i][7 - j] = tmp
                    tmp = matrix[7 - j][i]
                    matrix[7 - j][i] = matrix[j][7 - i]
                    matrix[j][7 - i] = tmp
                }
            }
        }
        return matrix
    }

    /**
    * (internal function) get 8x8 matrix from a column array
    */
    private _getMatrixFromColumns(columns: number[]): number[][] {
        let matrix: number[][] = this.getEmptyMatrix()
        for (let i = 0; i < 8; i++) {
            for (let j = 7; j >= 0; j--) {
                if (columns[i] >= 2 ** j) {
                    columns[i] -= 2 ** j
                    matrix[i][j] = 1
                } else if (columns[i] == 0) {
                    break
                }
            }
        }
        return matrix
    }

    /**
    * Scroll a text accross all MAX7219 matrix for once
    */
    //% block="%max7219 Scroll text $text|delay (ms) $delay|at the end wait (ms) $endDelay" text.defl="Hello world!" delay.min=0 delay.defl=75 endDelay.min=0 endDelay.defl=500
    //% blockId="MAX7219_scrollText"
    //% group="2. Display text on matrix" blockExternalInputs=true
    //% subcategory="dotmatrix_max7219"
    public scrollText(text: string, delay: number, endDelay: number) {
        let printPosition = this._displayArray.length - 8
        let characters_index: number[] = []
        let currentChrIndex = 0
        let currentFontArray: number[] = []
        let nextChrCountdown = 1
        let chrCountdown: number[] = []
        let totalScrollTime = 0
        // clear screen and array
        for (let i = 0; i < this._displayArray.length; i++) this._displayArray[i] = 0
        this.clearAll()
        // get font index of every characters and total scroll time needed
        for (let i = 0; i < text.length; i++) {
            let index = this.font.indexOf(text.substr(i, 1))
            if (index >= 0) {
                characters_index.push(index)
                chrCountdown.push(this.font_matrix[index].length)
                totalScrollTime += this.font_matrix[index].length
            }
        }
        totalScrollTime += this._matrixNum * 8
        // print characters into array and scroll the array
        for (let i = 0; i < totalScrollTime; i++) {
            nextChrCountdown -= 1
            if (currentChrIndex < characters_index.length && nextChrCountdown == 0) {
                // print a character just "outside" visible area
                currentFontArray = this.font_matrix[characters_index[currentChrIndex]]
                if (currentFontArray != null)
                    for (let j = 0; j < currentFontArray.length; j++)
                        this._displayArray[printPosition + j] = currentFontArray[j]
                // wait until current character scrolled into visible area
                nextChrCountdown = chrCountdown[currentChrIndex]
                currentChrIndex += 1
            }
            // scroll array (copy all columns to the one before it)
            for (let j = 0; j < this._displayArray.length - 1; j++) {
                this._displayArray[j] = this._displayArray[j + 1]
            }
            this._displayArray[this._displayArray.length - 1] = 0
            // write every 8 columns of display array (visible area) to each MAX7219s
            let matrixCountdown = this._matrixNum - 1
            let actualMatrixIndex = 0
            for (let j = 8; j < this._displayArray.length - 8; j += 8) {
                if (matrixCountdown < 0) break
                if (!this._reversed) actualMatrixIndex = matrixCountdown
                else actualMatrixIndex = this._matrixNum - 1 - matrixCountdown
                if (this._rotation == max7219_rotation_direction.none) {
                    for (let k = j; k < j + 8; k++)
                        this._registerForOne(this._DIGIT[k - j], this._displayArray[k], actualMatrixIndex)
                } else { // rotate matrix if needed
                    let tmpColumns = [0, 0, 0, 0, 0, 0, 0, 0]
                    let l = 0
                    for (let k = j; k < j + 8; k++) tmpColumns[l++] = this._displayArray[k]
                    this.displayLEDsForOne(this._getMatrixFromColumns(tmpColumns), actualMatrixIndex)
                }
                matrixCountdown--
            }
            basic.pause(delay)
        }
        basic.pause(endDelay)
    }

    /**
    * Print a text accross the chain of MAX7219 matrix at a specific spot. Offset value -8 ~ last column of matrix. You can choose to clear the screen or not (if not it can be used to print multiple string on the MAX7219 chain).
    */
    //% block="%max7219 Display text (align left) $text|offset $offset|clear screen first $clear" text.defl="Hi!" offset.min=-8 clear.defl=true
    //% blockId="MAX7219_displayText"
    //% group="2. Display text on matrix" blockExternalInputs=true
    //% subcategory="dotmatrix_max7219"
    public displayText(text: string, offset: number, clear: boolean) {
        // clear screen and array if needed
        if (clear) {
            for (let i = 0; i < this._displayArray.length; i++) this._displayArray[i] = 0
            this.clearAll()
        }
        let printPosition = Math.constrain(offset, -8, this._displayArray.length - 9) + 8
        let currentPosition = printPosition
        let characters_index: number[] = []
        let currentChrIndex = 0
        let currentFontArray: number[] = []
        // get font index of every characters
        for (let i = 0; i < text.length; i++) {
            let index = this.font.indexOf(text.substr(i, 1))
            if (index >= 0) characters_index.push(index)
        }
        // print characters into array from offset position
        while (currentPosition < this._displayArray.length - 8) {
            currentFontArray = this.font_matrix[characters_index[currentChrIndex]]
            if (currentFontArray != null)
                for (let j = 0; j < currentFontArray.length; j++)
                    this._displayArray[printPosition++] = currentFontArray[j]
            currentChrIndex += 1
            if (currentChrIndex == characters_index.length) break
        }
        // write every 8 columns of display array (visible area) to each MAX7219s
        let matrixCountdown = this._matrixNum - 1
        let actualMatrixIndex = 0
        for (let i = 8; i < this._displayArray.length - 8; i += 8) {
            if (matrixCountdown < 0) break
            if (!this._reversed) actualMatrixIndex = matrixCountdown
            else actualMatrixIndex = this._matrixNum - 1 - matrixCountdown
            if (this._rotation == max7219_rotation_direction.none) {
                for (let j = i; j < i + 8; j++)
                    this._registerForOne(this._DIGIT[j - i], this._displayArray[j], actualMatrixIndex)
            } else { // rotate matrix and reverse order if needed
                let tmpColumns = [0, 0, 0, 0, 0, 0, 0, 0]
                let l = 0
                for (let j = i; j < i + 8; j++)  tmpColumns[l++] = this._displayArray[j]
                this.displayLEDsForOne(this._getMatrixFromColumns(tmpColumns), actualMatrixIndex)
            }
            matrixCountdown--
        }
    }
    
    /**
    * Print a text on the chain of MAX7219 matrix and automatically align to the right.
    */
    //% block="%max7219 Display text (align right) $text|clear screen first $clear" text.defl="Hi!" clear.defl=true
    //% blockId="MAX7219_displayTextAlignRight"
    //% group="2. Display text on matrix" blockExternalInputs=true
    //% subcategory="dotmatrix_max7219"
    public displayTextAlignRight(text: string, clear: boolean) {
        let len = 0
        for (let i = 0; i < text.length; i++) {
            let index = this.font.indexOf(text.substr(i, 1))
            if (index >= 0) len += this.font_matrix[index].length
        }
        this.displayText(text, this._matrixNum * 8 - len, clear)
    }

    /**
    * Print a custom character from a number array on the chain of MAX7219 matrix at a specific spot. Each number in the array is 0-255, the decimal version of column's byte number. Offset value -8 ~ last column of matrix. You can choose to clear the screen or not (if not it can be used to print multiple string on the MAX7219 chain).
    */
    //% block="%max7219 Display custom character from|number array $customCharArray|offset $offset|clear screen first $clear" offset.min=-8 clear.defl=true
    //% blockId="MAX7219_displayCustomCharacter"
    //% group="2. Display text on matrix" blockExternalInputs=true
    //% subcategory="more dotmatrix_max7219"
    public displayCustomCharacter(customCharArray: number[], offset: number, clear: boolean) {
        // clear screen and array if needed
        if (clear) {
            for (let i = 0; i < this._displayArray.length; i++) this._displayArray[i] = 0
            this.clearAll()
        }
        let printPosition: number = Math.constrain(offset, -8, this._displayArray.length - 9) + 8
        if (customCharArray != null) {
            // print column data to display array
            for (let i = 0; i < customCharArray.length; i++)
                this._displayArray[printPosition + i] = customCharArray[i]
            // write every 8 columns of display array (visible area) to each MAX7219s
            let matrixCountdown = this._matrixNum - 1
            let actualMatrixIndex = 0
            for (let i = 8; i < this._displayArray.length - 8; i += 8) {
                if (matrixCountdown < 0) break
                if (!this._reversed) actualMatrixIndex = matrixCountdown
                else actualMatrixIndex = this._matrixNum - 1 - matrixCountdown
                if (this._rotation == max7219_rotation_direction.none) {
                    for (let j = i; j < i + 8; j++)
                        this._registerForOne(this._DIGIT[j - i], this._displayArray[j], actualMatrixIndex)
                } else { // rotate matrix and reverse order if needed
                    let tmpColumns = [0, 0, 0, 0, 0, 0, 0, 0]
                    let l = 0
                    for (let j = i; j < i + 8; j++) tmpColumns[l++] = this._displayArray[j]
                    this.displayLEDsForOne(this._getMatrixFromColumns(tmpColumns), actualMatrixIndex)
                }
                matrixCountdown--
            }
        }
    }

    /**
    * Return a number array calculated from a 8x8 LED byte array (example: B00100000,B01000000,B10000110,B10000000,B10000000,B10000110,B01000000,B00100000)
    */
    //% block="%max7219 Get custom character number array|from byte-array string $text" text.defl="B00100000,B01000000,B10000110,B10000000,B10000000,B10000110,B01000000,B00100000"
    //% blockId="MAX7219_getCustomCharacterArray"
    //% group="2. Display text on matrix" blockExternalInputs=true
    //% subcategory="more dotmatrix_max7219"
    public getCustomCharacterArray(text: string) {
        let tempTextArray: string[] = []
        let resultNumberArray: number[] = []
        let currentIndex = 0
        let currentChr = ""
        let currentNum = 0
        let columnNum = 0
        if (text != null && text.length >= 0) {
            // seperate each byte number to a string
            while (currentIndex < text.length) {
                tempTextArray.push(text.substr(currentIndex + 1, 8))
                currentIndex += 10
            }
            for (let i = 0; i < tempTextArray.length; i++) {
                columnNum = 0
                // read each bit and calculate the decimal sum
                for (let j = tempTextArray[i].length - 1; j >= 0; j--) {
                    currentChr = tempTextArray[i].substr(j, 1)
                    if (currentChr == "1" || currentChr == "0")
                        currentNum = parseInt(currentChr)
                    else
                        currentNum = 0
                    columnNum += (2 ** (tempTextArray[i].length - j - 1)) * currentNum
                }
                // generate new decimal array
                resultNumberArray.push(columnNum)
            }
            return resultNumberArray
        } else {
            return null
        }
    }

    /**
    * Add a custom character from a number array at the end of the extension's font library.
    * Each number in the array is 0-255, the decimal version of column's byte number.
    */
    //% block="%max7219 Add custom character $chr|number array $customCharArray|to the extension font library"
    //% blockId="MAX7219_addCustomChr"
    //% chr.defl=""
    //% blockExternalInputs=true
    //% group="2. Display text on matrix"
    //% subcategory="more dotmatrix_max7219"
    public addCustomChr(chr: string, customCharArray: number[]) {
        if (chr != null && chr.length == 1 && customCharArray != null) {
            // add new character
            this.font.push(chr)
            this.font_matrix.push(customCharArray)
        }
    }

    /**
    * Display all fonts in the extension font library
    */
    //% block="%max7219 Display all fonts at delay $delay" delay.min=0 delay.defl=200
    //% blockId="MAX7219_fontDemo"
    //% group="2. Display text on matrix"
    //% subcategory="more dotmatrix_max7219"
    public fontDemo(delay: number) {
        let offsetIndex = 0
        this.clearAll()
        // print all characters on all matrix
        for (let i = 1; i < this.font_matrix.length; i++) {
            // print two blank spaces to "reset" a matrix
            this.displayCustomCharacter(this.font_matrix[0], offsetIndex * 8, false)
            this.displayCustomCharacter(this.font_matrix[0], offsetIndex * 8 + 4, false)
            // print a character
            this.displayCustomCharacter(this.font_matrix[i], offsetIndex * 8, false)
            if (offsetIndex == this._matrixNum - 1) offsetIndex = 0
            else offsetIndex += 1
            basic.pause(delay)
        }
        basic.pause(delay)
        this.clearAll()
    }

    /**
    * Turn on or off all MAX7219s
    */
    //% block="%max7219 Turn on all matrix $status" status.defl=true
    //% blockId="MAX7219_togglePower"
    //% group="3. Basic light control"
    //% subcategory="more dotmatrix_max7219"
    public togglePower(status: boolean) {
        if (status) this._registerAll(this._SHUTDOWN, 1)
        else this._registerAll(this._SHUTDOWN, 0)
    }

    /**
    * Set brightness level of LEDs on all MAX7219s
    */
    //% block="%max7219 Set all brightness level $level" level.min=0 level.max=15 level.defl=15
    //% blockId="MAX7219_brightnessAll"
    //% group="3. Basic light control"
    //% subcategory="dotmatrix_max7219"
    public brightnessAll(level: number) {
        this._registerAll(this._INTENSITY, level)
    }

    /**
    * Set brightness level of LEDs on a specific MAX7219s (index 0=farthest on the chain)
    */
    //% block="%max7219 Set brightness level $level on matrix index = $index" level.min=0 level.max=15 level.defl=15 index.min=0
    //% blockId="MAX7219_brightnessForOne"
    //% group="3. Basic light control"
    //% subcategory="more dotmatrix_max7219"
    public brightnessForOne(level: number, index: number) {
        this._registerForOne(this._INTENSITY, level, index)
    }

    /**
    * Turn on all LEDs on all MAX7219s
    */
    //% block="%max7219 Fill all LEDs"
    //% blockId="MAX7219_fillAll"
    //% group="3. Basic light control"
    //% subcategory="dotmatrix_max7219"
    public fillAll() {
        for (let i = 0; i < 8; i++) this._registerAll(this._DIGIT[i], 255)
    }

    /**
    * Turn on LEDs on a specific MAX7219
    */
    //% block="%max7219 Fill LEDs on matrix index = $index" index.min=0
    //% blockId="MAX7219_fillForOne"
    //% group="3. Basic light control"
    //% subcategory="more dotmatrix_max7219"
    public fillForOne(index: number) {
        for (let i = 0; i < 8; i++) this._registerForOne(this._DIGIT[i], 255, index)
    }

    /**
    * Turn off LEDs on all MAX7219s
    */
    //% block="%max7219 Clear all LEDs"
    //% blockId="MAX7219_clearAll"
    //% group="3. Basic light control"
    //% subcategory="dotmatrix_max7219"
    public clearAll() {
        for (let i = 0; i < 8; i++) this._registerAll(this._DIGIT[i], 0)
    }

    /**
    * Turn off LEDs on a specific MAX7219 (index 0=farthest on the chain)
    */
    //% block="%max7219 Clear LEDs on matrix index = $index" index.min=0
    //% blockId="MAX7219_clearForOne"
    //% group="3. Basic light control"
    //% subcategory="more dotmatrix_max7219"
    public clearForOne(index: number) {
        for (let i = 0; i < 8; i++) this._registerForOne(this._DIGIT[i], 0, index)
    }

    /**
    * Turn on LEDs randomly on all MAX7219s
    */
    //% block="%max7219 Randomize all LEDs" index.min=0
    //% blockId="MAX7219_randomizeAll"
    //% group="3. Basic light control"
    //% subcategory="dotmatrix_max7219"
    public randomizeAll() {
        for (let i = 0; i < 8; i++) this._registerAll(this._DIGIT[i], Math.randomRange(0, 255))
    }

    /**
    * Turn on LEDs randomly on a specific MAX7219 (index 0=farthest on the chain)
    */
    //% block="%max7219 Randomize LEDs on matrix index = $index" index.min=0
    //% blockId="MAX7219_randomizeForOne"
    //% group="3. Basic light control"
    //% subcategory="more dotmatrix_max7219"
    public randomizeForOne(index: number) {
        for (let i = 0; i < 8; i++) this._registerForOne(this._DIGIT[i], Math.randomRange(0, 255), index)
    }

    /**
    * Set LEDs of all MAX7219s to a pattern from a 8x8 matrix variable (index 0=farthest on the chain)
    */
    //% block="%max7219 Display 8x8 pattern $newMatrix on all matrix"
    //% blockId="MAX7219_displayLEDsToAll"
    //% group="4. Set custom LED pattern on matrix"
    //% subcategory="more dotmatrix_max7219"
    public displayLEDsToAll(newMatrix: number[][]) {
        let columnValue = 0
        if (newMatrix != null) {
            if (this._rotation != max7219_rotation_direction.none) newMatrix = this._rotateMatrix(newMatrix) // rotate matrix if needed
            for (let i = 0; i < 8; i++) {
                if (newMatrix[i] != null) {
                    columnValue = 0
                    for (let j = 0; j < 8; j++) {
                        if (newMatrix[i][j]) {
                            // combine row 0-7 status into a byte number (0-255)
                            columnValue += 2 ** j
                        }
                    }
                    this._registerAll(this._DIGIT[i], columnValue)
                }
            }
        }
    }

    /**
    * Set LEDs of a specific MAX7219s to a pattern from a 8x8 number matrix variable (index 0=farthest on the chain)
    */
    //% block="%max7219 Display 8x8 pattern $newMatrix|on matrix index = $index" index.min=0 blockExternalInputs=true
    //% blockId="MAX7219_displayLEDsForOne"
    //% group="4. Set custom LED pattern on matrix"
    //% subcategory="dotmatrix_max7219"
    public displayLEDsForOne(newMatrix: number[][], index: number) {
        let columnValue = 0
        if (newMatrix != null) {
            if (this._rotation != max7219_rotation_direction.none) newMatrix = this._rotateMatrix(newMatrix) // rotate matrix if needed
            for (let i = 0; i < 8; i++) {
                if (newMatrix[i] != null) {
                    columnValue = 0
                    for (let j = 0; j < 8; j++) {
                        if (newMatrix[i][j]) {
                            // combine row 0-7 status into a byte number (0-255)
                            columnValue += 2 ** j
                        }
                    }
                    this._registerForOne(this._DIGIT[i], columnValue, index)
                }
            }
        }
    }

    /**
    * Return a empty 8x8 number matrix variable
    */
    //% block="%max7219 Empty 8x8 pattern"
    //% blockId="MAX7219_getEmptyMatrix"
    //% group="4. Set custom LED pattern on matrix"
    //% subcategory="dotmatrix_max7219"
    public getEmptyMatrix() {
        return [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
        ]
    }

    /**
    * Return a full 8x8 number matrix variable
    */
    //% block="%max7219 Full 8x8 pattern"
    //% blockId="MAX7219_getFullMatrix"
    //% group="4. Set custom LED pattern on matrix"
    //% subcategory="more dotmatrix_max7219"
    public getFullMatrix() {
        return [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
        ]
    }

    /**
    * Return a specific value from a 8x8 number matrix variable
    */
    //% block="%max7219 Get value from 8x8 pattern %matrix|x = $x y = $y" x.min=0 x.max=7 y.min=0 y.max=7
    //% blockId="MAX7219_getValueFromMatrix"
    //% group="4. Set custom LED pattern on matrix" blockExternalInputs=true
    //% subcategory="more dotmatrix_max7219"
    public getValueFromMatrix(matrix: number[][], x: number, y: number) {
        return matrix[x][y]
    }

    /**
    * Set a specific value in a 8x8 number matrix variable
    */
    //% block="%max7219 Set 8x8 pattern %matrix|x = $x y = $y value to $value" value.min=0 value.max=1 x.min=0 x.max=7 y.min=0 y.max=7 
    //% blockId="MAX7219_setValueInMatrix"
    //% group="4. Set custom LED pattern on matrix" blockExternalInputs=true
    //% subcategory="dotmatrix_max7219"
    public setValueInMatrix(matrix: number[][], x: number, y: number, value: number) {
        matrix[x][y] = value
    }

    /**
    * Toggle (between 0/1) a specific value in a 8x8 number matrix variable
    */
    //% block="%max7219 Toogle value in 8x8 pattern %matrix|x = $x y = $y" x.min=0 x.max=7 y.min=0 y.max=7
    //% blockId="MAX7219_toggleValueInMatrix"
    //% group="4. Set custom LED pattern on matrix" blockExternalInputs=true
    //% subcategory="more dotmatrix_max7219"
    public toogleValueInMatrix(matrix: number[][], x: number, y: number) {
        if (matrix[x][y] == 1) matrix[x][y] = 0
        else if (matrix[x][y] == 0) matrix[x][y] = 1
    }

  }

    /**
     * create a MAX7219 object.
     */
    //% blockId="MAX7219_create"
    //% block="Create Dot Matrix Display"
    //% subcategory="dotmatrix_max7219"
    export function create(): MAX7219 {
        let max7219 = new MAX7219();
        //oled.initOLED(addr);
        return max7219;
    }

}

enum max7219_rotation_direction {
    //% block="none"
    none = 0,
    //% block="clockwise"
    clockwise = 1,
    //% block="counter-clockwise"
    counterclockwise = 2,
    //% block="180-degree"
    one_eighty_degree = 3,
}

