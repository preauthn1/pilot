import Vue from 'vue';
import Main from './win-notice.vue';
import i18n from "../../locale";
const NotificationConstructor = Vue.extend(Main);

let instance;
let instances = [];
let seed = 1;

const Notification = function(options) {
    if (Vue.prototype.$isServer) return;
    options = options || {}
    const userOnClose = options.onClose;
    const id = 'notification_' + seed++;

    options.onClose = function() {
        Notification.close(id, userOnClose);
    };

    instance = new NotificationConstructor({
        i18n,
        data: options
    });

    instance.id = id;
    instance.$mount();
    document.body.appendChild(instance.$el);
    instance.visible = true;
    instance.dom = instance.$el;
    instance.dom.style.zIndex = 50;

    let verticalOffset = options.offset || 78;
    instances.forEach(item => {
        verticalOffset += item.$el.offsetHeight + 4;
    });
    instance.verticalOffset = verticalOffset;
    instances.push(instance);
    return instance;
};

Notification.close = function(id, userOnClose) {
    let index = -1;
    const len = instances.length;
    const instance = instances.filter((instance, i) => {
        if (instance.id === id) {
            index = i;
            return true;
        }
        return false;
    })[0];
    if (!instance) return;

    if (typeof userOnClose === 'function') {
        userOnClose(instance);
    }
    instances.splice(index, 1);

    if (len <= 1) return;
    const position = instance.position;
    const removedHeight = instance.dom.offsetHeight;
    for (let i = index; i < len - 1 ; i++) {
        if (instances[i].position === position) {
            instances[i].dom.style.top =
                parseInt(instances[i].dom.style.top, 10) - removedHeight - 4 + 'px';
        }
    }
};

export default Notification;
