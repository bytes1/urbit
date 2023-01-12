(function (f) {
  if (typeof exports === "object" && typeof module !== "undefined") {
    module.exports = f();
  } else if (typeof define === "function" && define.amd) {
    define([], f);
  } else {
    var g;

    if (typeof window !== "undefined") {
      g = window;
    } else if (typeof global !== "undefined") {
      g = global;
    } else if (typeof self !== "undefined") {
      g = self;
    } else {
      g = this;
    }

    g.snap = f();
  }
})(function () {
  var define, module, exports;
  return function () {
    function r(e, n, t) {
      function o(i, f) {
        if (!n[i]) {
          if (!e[i]) {
            var c = "function" == typeof require && require;
            if (!f && c) return c(i, !0);
            if (u) return u(i, !0);
            var a = new Error("Cannot find module '" + i + "'");
            throw a.code = "MODULE_NOT_FOUND", a;
          }

          var p = n[i] = {
            exports: {}
          };
          e[i][0].call(p.exports, function (r) {
            var n = e[i][1][r];
            return o(n || r);
          }, p, p.exports, r, e, n, t);
        }

        return n[i].exports;
      }

      for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);

      return o;
    }

    return r;
  }()({
    1: [function (require, module, exports) {
      function _defineProperty(obj, key, value) {
        if (key in obj) {
          Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
          });
        } else {
          obj[key] = value;
        }

        return obj;
      }

      module.exports = _defineProperty, module.exports.__esModule = true, module.exports["default"] = module.exports;
    }, {}],
    2: [function (require, module, exports) {
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
          "default": obj
        };
      }

      module.exports = _interopRequireDefault, module.exports.__esModule = true, module.exports["default"] = module.exports;
    }, {}],
    3: [function (require, module, exports) {
      "use strict";

      var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.onCronjob = void 0;

      var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

      function ownKeys(object, enumerableOnly) {
        var keys = Object.keys(object);

        if (Object.getOwnPropertySymbols) {
          var symbols = Object.getOwnPropertySymbols(object);
          enumerableOnly && (symbols = symbols.filter(function (sym) {
            return Object.getOwnPropertyDescriptor(object, sym).enumerable;
          })), keys.push.apply(keys, symbols);
        }

        return keys;
      }

      function _objectSpread(target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = null != arguments[i] ? arguments[i] : {};
          i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
            (0, _defineProperty2.default)(target, key, source[key]);
          }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
          });
        }

        return target;
      }

      async function saveState(newState) {
        await wallet.request({
          method: 'snap_manageState',
          params: ['update', _objectSpread({}, newState)]
        });
      }

      async function getState() {
        const state = await wallet.request({
          method: 'snap_manageState',
          params: ['get']
        });

        if (state === null) {
          return {};
        }

        return state !== null && state !== void 0 ? state : {};
      }

      const getEOAAccount = async () => {
        const accounts = await wallet.request({
          method: 'eth_accounts'
        });
        return accounts[0];
      };

      async function getFeeds() {
        const account = await getEOAAccount();

        if (account) {
          const response = await fetch(`ship:url/{account}`);
          return response.json();
        }

        return null;
      }

      function filter(data) {
        if (data['feeds'].length > 0) {
          const data_1 = data['feeds'].map(a => [a['payload']['data']['sid'], a['payload']['data']['app'], a['payload']['data']['amsg']]);
          return data_1;
        }

        return [];
      }

      const onCronjob = async ({
        origin,
        request
      }) => {
        const store_ssid = Object.values(await getState());

        switch (request.method) {
          case 'check':
            console.log('checking notification');
            const notification = filter(await getFeeds());
            const ssid = notification.map(a => a[0]);

            if (ssid.length > 0 || store_ssid.length > 0) {
              if (JSON.stringify(store_ssid) === JSON.stringify(ssid)) {
                console.log('no new messages');
              } else {
                const push_data = notification.filter(data => !store_ssid.includes(data[0]));

                if (push_data.length > 0) {
                  wallet.request({
                    method: 'snap_notify',
                    params: [{
                      type: 'native',
                      message: `NEW NOTIFICATION:${push_data.length}`
                    }]
                  });
                  await saveState(ssid);
                }

                if (push_data.length > 1) {
                  let string = '';

                  for (let i = 0; i < push_data.length; i++) {
                    string = string + `========================\nChannel Name:${push_data[i][1]} \n Message: ${push_data[i][2]} \n`;
                  }

                  const data = await wallet.request({
                    method: 'snap_confirm',
                    params: [{
                      prompt: 'NEW NOTIFICATIONS RECEIVED',
                      description: 'This custom confirmation is just for display purposes.',
                      textAreaContent: `${string}`
                    }]
                  });
                }

                console.log(push_data);

                if (push_data.length === 1) {
                  const data = await wallet.request({
                    method: 'snap_notify',
                    params: [{
                      type: 'inApp',
                      message: `${push_data[0][2]}`
                    }]
                  });
                }
              }
            }

            break;

          default:
            throw new Error('Method not found.');
        }
      };

      exports.onCronjob = onCronjob;
    }, {
      "@babel/runtime/helpers/defineProperty": 1,
      "@babel/runtime/helpers/interopRequireDefault": 2
    }]
  }, {}, [3])(3);
});