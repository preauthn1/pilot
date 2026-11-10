export default class Line {
    public lines: number[][];
    private line1: number[] = [0, 1, 2, 3, 4];
    private line2: number[] = [5, 6, 7, 8, 9];
    private line3: number[] = [10, 11, 12, 13, 14];
    private line4: number[] = [0, 6, 12, 8, 4];
    private line5: number[] = [10, 6, 2, 8, 14];
    private line6: number[] = [5, 1, 2, 3, 9];
    private line7: number[] = [5, 11, 12, 13, 9];
    private line8: number[] = [0, 1, 7, 13, 14];
    private line9: number[] = [10, 11, 7, 3, 4];
    private line10: number[] = [10, 6, 7, 8, 4];
    private line11: number[] = [0, 6, 7, 8, 14];
    constructor() {
        this.lines = [];
        this.lines.push(this.line1);
        this.lines.push(this.line2);
        this.lines.push(this.line3);
        this.lines.push(this.line4);
        this.lines.push(this.line5);
        this.lines.push(this.line6);
        this.lines.push(this.line7);
        this.lines.push(this.line8);
        this.lines.push(this.line9);
        this.lines.push(this.line10);
        this.lines.push(this.line11);
    }

    checkRow(row: number[]): { len: number, num: number, double: boolean } {
        let head: number;
        for (let i = 0; i < row.length; i++) {
            if (row[i] != 1) {
                head = row[i];
                break;
            }
        }

        let len: number;
        let double: boolean = false;
        for (let i = 0; i < row.length; i++) {
            let flag = row[i] !== head && row[i] !== 1;
            let flag2 = i < 1;
            if (flag && flag2) {
                //  log("return   head:",head,i)
                return { len: 0, num: NaN, double: false };
            }

            if (row[i] == 1)
                double = true;
            if (i >= 1) {
                if (flag) {
                    break;
                } else {
                    len = i + 1;
                }
            }
        }
        return { len: len, num: head, double: double };
    }

    testMult(list: number[]): { lines: number[][], aliveLine: any[], mult: number } {
        let lines: number[][] = [];
        for (let i = 0; i < 3; i++) {
            let listChild = [list[i * 5], list[i * 5 + 1], list[i * 5 + 2], list[i * 5 + 3], list[i * 5 + 4]];
            lines.push(listChild)
        }

        let hightLine = [];
        for (let i = 0; i < this.lines.length; i++) {
            const element = this.lines[i];
            let arr = [];
            for (let j = 0; j < element.length; j++) {
                const index = element[j];
                arr.push(list[index]);
            }
            const check = this.checkRow(arr);
            if (check.len > 0 && !isNaN(check.num)) {
                hightLine.push({ lineNo: (i + 1), num: check.num, len: check.len, double: check.double })
            }
        }
        let dels = []
        hightLine.forEach(li => {
            if ((li.num != 9 && li.num != 3 && li.num != 7 && li.num != 1) && li.len < 3) {
                dels.push(li);
            }
        })
        dels.forEach(de => {
            const delIndex = hightLine.findIndex(fi => fi.lineNo == de.lineNo);
            hightLine.splice(delIndex, 1);
        })

        let mult = 0;
        let lineMult = 0
        let alive = [];
        hightLine.forEach(hi => {
            const rule = this.getCardRuleByNo(hi.num);
            lineMult = 0;
            for (let i = 0; i < rule.length; i++) {
                const element = rule[i];
                if (element[0] == hi.len) {
                    lineMult += element[1];
                    lineMult = hi.double ? lineMult * 2 : lineMult;
                    mult += lineMult;
                    break;
                }
            }
            alive.push({
                no: hi.lineNo,
                len: hi.len,
                tpCount: hi.double ? 1 : 0,     //
                imgNo: hi.num,
                pay: lineMult    //
            });
        })

        //{ lineNo: (i + 1), num: check.num, len: check.len, double: check.double }
        return { lines: lines, aliveLine: alive, mult: parseFloat(mult.toFixed(2)) };
    }

    getCardRuleByNo(No: number): number[][] {

        let rule: number[][];
        switch (No) { // 
            case 1://骷髅()
                rule = [[2, 1], [3, 25], [4, 250], [5, 900]]
                break;
            case 7://卷轴/金币
            case 3://卷轴/金币
                rule = [[2, 0.2], [3, 2.5], [4, 12.5], [5, 75]]
                break;
            case 4://船锚
            case 6://钩子
                rule = [[3, 1.5], [4, 7.5], [5, 25]]
                break;
            case 5://宝箱
                rule = [[3, 2], [4, 10], [5, 40]]
                break
            case 8://K
            case 2://A
                rule = [[3, 1], [4, 5], [5, 12.5]]
                break;
            case 9:
                rule = [[2, 0.2], [3, 0.5], [4, 2.5], [5, 10]]
                break;
            case 10:
            case 11:
            case 12:
                rule = [[3, 0.5], [4, 2.5], [5, 10]];
                break;
            case -1:
                break;
        }
        return rule
    }


}