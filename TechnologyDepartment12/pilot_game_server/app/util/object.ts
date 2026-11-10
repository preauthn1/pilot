export function crop(o: object, ...exclude: string[]) {
    let result = null
    if (typeof o === 'object') {
        if (Array.isArray(o)) {
        result = []
            o.forEach(e => {
                result.push(crop(e, ...exclude))
            })
        } else if(o===null) {
            result = null;   
        } else if(o.constructor===RegExp){
            result = o;
        }else {
                result = {};
            for (let key in o) {
                if(exclude.includes(key)) {
                    continue
                }
                result[key] = crop(o[key], ...exclude);
            }
        }
    } else {
        result = o;
    }
    return result;
}