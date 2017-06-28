'use strict';

window.whatInput = function () {

  'use strict';

  /*
    ---------------
    variables
    ---------------
  */

  // array of actively pressed keys

  var activeKeys = [];

  // cache document.body
  var body;

  // boolean: true if touch buffer timer is running
  var buffer = false;

  // the last used input type
  var currentInput = null;

  // `input` types that don't accept text
  var nonTypingInputs = ['button', 'checkbox', 'file', 'image', 'radio', 'reset', 'submit'];

  // detect version of mouse wheel event to use
  // via https://developer.mozilla.org/en-US/docs/Web/Events/wheel
  var mouseWheel = detectWheel();

  // list of modifier keys commonly used with the mouse and
  // can be safely ignored to prevent false keyboard detection
  var ignoreMap = [16, // shift
  17, // control
  18, // alt
  91, // Windows key / left Apple cmd
  93 // Windows menu / right Apple cmd
  ];

  // mapping of events to input types
  var inputMap = {
    'keydown': 'keyboard',
    'keyup': 'keyboard',
    'mousedown': 'mouse',
    'mousemove': 'mouse',
    'MSPointerDown': 'pointer',
    'MSPointerMove': 'pointer',
    'pointerdown': 'pointer',
    'pointermove': 'pointer',
    'touchstart': 'touch'
  };

  // add correct mouse wheel event mapping to `inputMap`
  inputMap[detectWheel()] = 'mouse';

  // array of all used input types
  var inputTypes = [];

  // mapping of key codes to a common name
  var keyMap = {
    9: 'tab',
    13: 'enter',
    16: 'shift',
    27: 'esc',
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };

  // map of IE 10 pointer events
  var pointerMap = {
    2: 'touch',
    3: 'touch', // treat pen like touch
    4: 'mouse'
  };

  // touch buffer timer
  var timer;

  /*
    ---------------
    functions
    ---------------
  */

  // allows events that are also triggered to be filtered out for `touchstart`
  function eventBuffer() {
    clearTimer();
    setInput(event);

    buffer = true;
    timer = window.setTimeout(function () {
      buffer = false;
    }, 650);
  }

  function bufferedEvent(event) {
    if (!buffer) setInput(event);
  }

  function unBufferedEvent(event) {
    clearTimer();
    setInput(event);
  }

  function clearTimer() {
    window.clearTimeout(timer);
  }

  function setInput(event) {
    var eventKey = key(event);
    var value = inputMap[event.type];
    if (value === 'pointer') value = pointerType(event);

    // don't do anything if the value matches the input type already set
    if (currentInput !== value) {
      var eventTarget = target(event);
      var eventTargetNode = eventTarget.nodeName.toLowerCase();
      var eventTargetType = eventTargetNode === 'input' ? eventTarget.getAttribute('type') : null;

      if ( // only if the user flag to allow typing in form fields isn't set
      !body.hasAttribute('data-whatinput-formtyping') &&

      // only if currentInput has a value
      currentInput &&

      // only if the input is `keyboard`
      value === 'keyboard' &&

      // not if the key is `TAB`
      keyMap[eventKey] !== 'tab' && (

      // only if the target is a form input that accepts text
      eventTargetNode === 'textarea' || eventTargetNode === 'select' || eventTargetNode === 'input' && nonTypingInputs.indexOf(eventTargetType) < 0) ||
      // ignore modifier keys
      ignoreMap.indexOf(eventKey) > -1) {
        // ignore keyboard typing
      } else {
          switchInput(value);
        }
    }

    if (value === 'keyboard') logKeys(eventKey);
  }

  function switchInput(string) {
    currentInput = string;
    body.setAttribute('data-whatinput', currentInput);

    if (inputTypes.indexOf(currentInput) === -1) inputTypes.push(currentInput);
  }

  function key(event) {
    return event.keyCode ? event.keyCode : event.which;
  }

  function target(event) {
    return event.target || event.srcElement;
  }

  function pointerType(event) {
    if (typeof event.pointerType === 'number') {
      return pointerMap[event.pointerType];
    } else {
      return event.pointerType === 'pen' ? 'touch' : event.pointerType; // treat pen like touch
    }
  }

  // keyboard logging
  function logKeys(eventKey) {
    if (activeKeys.indexOf(keyMap[eventKey]) === -1 && keyMap[eventKey]) activeKeys.push(keyMap[eventKey]);
  }

  function unLogKeys(event) {
    var eventKey = key(event);
    var arrayPos = activeKeys.indexOf(keyMap[eventKey]);

    if (arrayPos !== -1) activeKeys.splice(arrayPos, 1);
  }

  function bindEvents() {
    body = document.body;

    // pointer events (mouse, pen, touch)
    if (window.PointerEvent) {
      body.addEventListener('pointerdown', bufferedEvent);
      body.addEventListener('pointermove', bufferedEvent);
    } else if (window.MSPointerEvent) {
      body.addEventListener('MSPointerDown', bufferedEvent);
      body.addEventListener('MSPointerMove', bufferedEvent);
    } else {

      // mouse events
      body.addEventListener('mousedown', bufferedEvent);
      body.addEventListener('mousemove', bufferedEvent);

      // touch events
      if ('ontouchstart' in window) {
        body.addEventListener('touchstart', eventBuffer);
      }
    }

    // mouse wheel
    body.addEventListener(mouseWheel, bufferedEvent);

    // keyboard events
    body.addEventListener('keydown', unBufferedEvent);
    body.addEventListener('keyup', unBufferedEvent);
    document.addEventListener('keyup', unLogKeys);
  }

  /*
    ---------------
    utilities
    ---------------
  */

  // detect version of mouse wheel event to use
  // via https://developer.mozilla.org/en-US/docs/Web/Events/wheel
  function detectWheel() {
    return mouseWheel = 'onwheel' in document.createElement('div') ? 'wheel' : // Modern browsers support "wheel"

    document.onmousewheel !== undefined ? 'mousewheel' : // Webkit and IE support at least "mousewheel"
    'DOMMouseScroll'; // let's assume that remaining browsers are older Firefox
  }

  /*
    ---------------
    init
     don't start script unless browser cuts the mustard,
    also passes if polyfills are used
    ---------------
  */

  if ('addEventListener' in window && Array.prototype.indexOf) {

    // if the dom is already ready already (script was placed at bottom of <body>)
    if (document.body) {
      bindEvents();

      // otherwise wait for the dom to load (script was placed in the <head>)
    } else {
        document.addEventListener('DOMContentLoaded', bindEvents);
      }
  }

  /*
    ---------------
    api
    ---------------
  */

  return {

    // returns string: the current input type
    ask: function () {
      return currentInput;
    },

    // returns array: currently pressed keys
    keys: function () {
      return activeKeys;
    },

    // returns array: all the detected input types
    types: function () {
      return inputTypes;
    },

    // accepts string: manually set the input type
    set: switchInput
  };
}();
;!function ($) {

  "use strict";

  var FOUNDATION_VERSION = '6.2.1';

  // Global Foundation object
  // This is attached to the window, or used as a module for AMD/Browserify
  var Foundation = {
    version: FOUNDATION_VERSION,

    /**
     * Stores initialized plugins.
     */
    _plugins: {},

    /**
     * Stores generated unique ids for plugin instances
     */
    _uuids: [],

    /**
     * Returns a boolean for RTL support
     */
    rtl: function () {
      return $('html').attr('dir') === 'rtl';
    },
    /**
     * Defines a Foundation plugin, adding it to the `Foundation` namespace and the list of plugins to initialize when reflowing.
     * @param {Object} plugin - The constructor of the plugin.
     */
    plugin: function (plugin, name) {
      // Object key to use when adding to global Foundation object
      // Examples: Foundation.Reveal, Foundation.OffCanvas
      var className = name || functionName(plugin);
      // Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
      // Examples: data-reveal, data-off-canvas
      var attrName = hyphenate(className);

      // Add to the Foundation object and the plugins list (for reflowing)
      this._plugins[attrName] = this[className] = plugin;
    },
    /**
     * @function
     * Populates the _uuids array with pointers to each individual plugin instance.
     * Adds the `zfPlugin` data-attribute to programmatically created plugins to allow use of $(selector).foundation(method) calls.
     * Also fires the initialization event for each plugin, consolidating repeditive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @param {String} name - the name of the plugin, passed as a camelCased string.
     * @fires Plugin#init
     */
    registerPlugin: function (plugin, name) {
      var pluginName = name ? hyphenate(name) : functionName(plugin.constructor).toLowerCase();
      plugin.uuid = this.GetYoDigits(6, pluginName);

      if (!plugin.$element.attr('data-' + pluginName)) {
        plugin.$element.attr('data-' + pluginName, plugin.uuid);
      }
      if (!plugin.$element.data('zfPlugin')) {
        plugin.$element.data('zfPlugin', plugin);
      }
      /**
       * Fires when the plugin has initialized.
       * @event Plugin#init
       */
      plugin.$element.trigger('init.zf.' + pluginName);

      this._uuids.push(plugin.uuid);

      return;
    },
    /**
     * @function
     * Removes the plugins uuid from the _uuids array.
     * Removes the zfPlugin data attribute, as well as the data-plugin-name attribute.
     * Also fires the destroyed event for the plugin, consolidating repeditive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @fires Plugin#destroyed
     */
    unregisterPlugin: function (plugin) {
      var pluginName = hyphenate(functionName(plugin.$element.data('zfPlugin').constructor));

      this._uuids.splice(this._uuids.indexOf(plugin.uuid), 1);
      plugin.$element.removeAttr('data-' + pluginName).removeData('zfPlugin')
      /**
       * Fires when the plugin has been destroyed.
       * @event Plugin#destroyed
       */
      .trigger('destroyed.zf.' + pluginName);
      for (var prop in plugin) {
        plugin[prop] = null; //clean up script to prep for garbage collection.
      }
      return;
    },

    /**
     * @function
     * Causes one or more active plugins to re-initialize, resetting event listeners, recalculating positions, etc.
     * @param {String} plugins - optional string of an individual plugin key, attained by calling `$(element).data('pluginName')`, or string of a plugin class i.e. `'dropdown'`
     * @default If no argument is passed, reflow all currently active plugins.
     */
    reInit: function (plugins) {
      var isJQ = plugins instanceof $;
      try {
        if (isJQ) {
          plugins.each(function () {
            $(this).data('zfPlugin')._init();
          });
        } else {
          var type = typeof plugins,
              _this = this,
              fns = {
            'object': function (plgs) {
              plgs.forEach(function (p) {
                p = hyphenate(p);
                $('[data-' + p + ']').foundation('_init');
              });
            },
            'string': function () {
              plugins = hyphenate(plugins);
              $('[data-' + plugins + ']').foundation('_init');
            },
            'undefined': function () {
              this['object'](Object.keys(_this._plugins));
            }
          };
          fns[type](plugins);
        }
      } catch (err) {
        console.error(err);
      } finally {
        return plugins;
      }
    },

    /**
     * returns a random base-36 uid with namespacing
     * @function
     * @param {Number} length - number of random base-36 digits desired. Increase for more random strings.
     * @param {String} namespace - name of plugin to be incorporated in uid, optional.
     * @default {String} '' - if no plugin name is provided, nothing is appended to the uid.
     * @returns {String} - unique id
     */
    GetYoDigits: function (length, namespace) {
      length = length || 6;
      return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)).toString(36).slice(1) + (namespace ? '-' + namespace : '');
    },
    /**
     * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
     * @param {Object} elem - jQuery object containing the element to check inside. Also checks the element itself, unless it's the `document` object.
     * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
     */
    reflow: function (elem, plugins) {

      // If plugins is undefined, just grab everything
      if (typeof plugins === 'undefined') {
        plugins = Object.keys(this._plugins);
      }
      // If plugins is a string, convert it to an array with one item
      else if (typeof plugins === 'string') {
          plugins = [plugins];
        }

      var _this = this;

      // Iterate through each plugin
      $.each(plugins, function (i, name) {
        // Get the current plugin
        var plugin = _this._plugins[name];

        // Localize the search to all elements inside elem, as well as elem itself, unless elem === document
        var $elem = $(elem).find('[data-' + name + ']').addBack('[data-' + name + ']');

        // For each plugin found, initialize it
        $elem.each(function () {
          var $el = $(this),
              opts = {};
          // Don't double-dip on plugins
          if ($el.data('zfPlugin')) {
            console.warn("Tried to initialize " + name + " on an element that already has a Foundation plugin.");
            return;
          }

          if ($el.attr('data-options')) {
            var thing = $el.attr('data-options').split(';').forEach(function (e, i) {
              var opt = e.split(':').map(function (el) {
                return el.trim();
              });
              if (opt[0]) opts[opt[0]] = parseValue(opt[1]);
            });
          }
          try {
            $el.data('zfPlugin', new plugin($(this), opts));
          } catch (er) {
            console.error(er);
          } finally {
            return;
          }
        });
      });
    },
    getFnName: functionName,
    transitionend: function ($elem) {
      var transitions = {
        'transition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'otransitionend'
      };
      var elem = document.createElement('div'),
          end;

      for (var t in transitions) {
        if (typeof elem.style[t] !== 'undefined') {
          end = transitions[t];
        }
      }
      if (end) {
        return end;
      } else {
        end = setTimeout(function () {
          $elem.triggerHandler('transitionend', [$elem]);
        }, 1);
        return 'transitionend';
      }
    }
  };

  Foundation.util = {
    /**
     * Function for applying a debounce effect to a function call.
     * @function
     * @param {Function} func - Function to be called at end of timeout.
     * @param {Number} delay - Time in ms to delay the call of `func`.
     * @returns function
     */
    throttle: function (func, delay) {
      var timer = null;

      return function () {
        var context = this,
            args = arguments;

        if (timer === null) {
          timer = setTimeout(function () {
            func.apply(context, args);
            timer = null;
          }, delay);
        }
      };
    }
  };

  // TODO: consider not making this a jQuery function
  // TODO: need way to reflow vs. re-initialize
  /**
   * The Foundation jQuery method.
   * @param {String|Array} method - An action to perform on the current jQuery object.
   */
  var foundation = function (method) {
    var type = typeof method,
        $meta = $('meta.foundation-mq'),
        $noJS = $('.no-js');

    if (!$meta.length) {
      $('<meta class="foundation-mq">').appendTo(document.head);
    }
    if ($noJS.length) {
      $noJS.removeClass('no-js');
    }

    if (type === 'undefined') {
      //needs to initialize the Foundation object, or an individual plugin.
      Foundation.MediaQuery._init();
      Foundation.reflow(this);
    } else if (type === 'string') {
      //an individual method to invoke on a plugin or group of plugins
      var args = Array.prototype.slice.call(arguments, 1); //collect all the arguments, if necessary
      var plugClass = this.data('zfPlugin'); //determine the class of plugin

      if (plugClass !== undefined && plugClass[method] !== undefined) {
        //make sure both the class and method exist
        if (this.length === 1) {
          //if there's only one, call it directly.
          plugClass[method].apply(plugClass, args);
        } else {
          this.each(function (i, el) {
            //otherwise loop through the jQuery collection and invoke the method on each
            plugClass[method].apply($(el).data('zfPlugin'), args);
          });
        }
      } else {
        //error for no class or no method
        throw new ReferenceError("We're sorry, '" + method + "' is not an available method for " + (plugClass ? functionName(plugClass) : 'this element') + '.');
      }
    } else {
      //error for invalid argument type
      throw new TypeError('We\'re sorry, ' + type + ' is not a valid parameter. You must use a string representing the method you wish to invoke.');
    }
    return this;
  };

  window.Foundation = Foundation;
  $.fn.foundation = foundation;

  // Polyfill for requestAnimationFrame
  (function () {
    if (!Date.now || !window.Date.now) window.Date.now = Date.now = function () {
      return new Date().getTime();
    };

    var vendors = ['webkit', 'moz'];
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
      var vp = vendors[i];
      window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
    }
    if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
      var lastTime = 0;
      window.requestAnimationFrame = function (callback) {
        var now = Date.now();
        var nextTime = Math.max(lastTime + 16, now);
        return setTimeout(function () {
          callback(lastTime = nextTime);
        }, nextTime - now);
      };
      window.cancelAnimationFrame = clearTimeout;
    }
    /**
     * Polyfill for performance.now, required by rAF
     */
    if (!window.performance || !window.performance.now) {
      window.performance = {
        start: Date.now(),
        now: function () {
          return Date.now() - this.start;
        }
      };
    }
  })();
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP = function () {},
          fBound = function () {
        return fToBind.apply(this instanceof fNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
      };

      if (this.prototype) {
        // native functions don't have a prototype
        fNOP.prototype = this.prototype;
      }
      fBound.prototype = new fNOP();

      return fBound;
    };
  }
  // Polyfill to get the name of a function in IE9
  function functionName(fn) {
    if (Function.prototype.name === undefined) {
      var funcNameRegex = /function\s([^(]{1,})\(/;
      var results = funcNameRegex.exec(fn.toString());
      return results && results.length > 1 ? results[1].trim() : "";
    } else if (fn.prototype === undefined) {
      return fn.constructor.name;
    } else {
      return fn.prototype.constructor.name;
    }
  }
  function parseValue(str) {
    if (/true/.test(str)) return true;else if (/false/.test(str)) return false;else if (!isNaN(str * 1)) return parseFloat(str);
    return str;
  }
  // Convert PascalCase to kebab-case
  // Thank you: http://stackoverflow.com/a/8955580
  function hyphenate(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
}(jQuery);
;'use strict';

!function ($) {

  Foundation.Box = {
    ImNotTouchingYou: ImNotTouchingYou,
    GetDimensions: GetDimensions,
    GetOffsets: GetOffsets
  };

  /**
   * Compares the dimensions of an element to a container and determines collision events with container.
   * @function
   * @param {jQuery} element - jQuery object to test for collisions.
   * @param {jQuery} parent - jQuery object to use as bounding container.
   * @param {Boolean} lrOnly - set to true to check left and right values only.
   * @param {Boolean} tbOnly - set to true to check top and bottom values only.
   * @default if no parent object passed, detects collisions with `window`.
   * @returns {Boolean} - true if collision free, false if a collision in any direction.
   */
  function ImNotTouchingYou(element, parent, lrOnly, tbOnly) {
    var eleDims = GetDimensions(element),
        top,
        bottom,
        left,
        right;

    if (parent) {
      var parDims = GetDimensions(parent);

      bottom = eleDims.offset.top + eleDims.height <= parDims.height + parDims.offset.top;
      top = eleDims.offset.top >= parDims.offset.top;
      left = eleDims.offset.left >= parDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= parDims.width;
    } else {
      bottom = eleDims.offset.top + eleDims.height <= eleDims.windowDims.height + eleDims.windowDims.offset.top;
      top = eleDims.offset.top >= eleDims.windowDims.offset.top;
      left = eleDims.offset.left >= eleDims.windowDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= eleDims.windowDims.width;
    }

    var allDirs = [bottom, top, left, right];

    if (lrOnly) {
      return left === right === true;
    }

    if (tbOnly) {
      return top === bottom === true;
    }

    return allDirs.indexOf(false) === -1;
  };

  /**
   * Uses native methods to return an object of dimension values.
   * @function
   * @param {jQuery || HTML} element - jQuery object or DOM element for which to get the dimensions. Can be any element other that document or window.
   * @returns {Object} - nested object of integer pixel values
   * TODO - if element is window, return only those values.
   */
  function GetDimensions(elem, test) {
    elem = elem.length ? elem[0] : elem;

    if (elem === window || elem === document) {
      throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");
    }

    var rect = elem.getBoundingClientRect(),
        parRect = elem.parentNode.getBoundingClientRect(),
        winRect = document.body.getBoundingClientRect(),
        winY = window.pageYOffset,
        winX = window.pageXOffset;

    return {
      width: rect.width,
      height: rect.height,
      offset: {
        top: rect.top + winY,
        left: rect.left + winX
      },
      parentDims: {
        width: parRect.width,
        height: parRect.height,
        offset: {
          top: parRect.top + winY,
          left: parRect.left + winX
        }
      },
      windowDims: {
        width: winRect.width,
        height: winRect.height,
        offset: {
          top: winY,
          left: winX
        }
      }
    };
  }

  /**
   * Returns an object of top and left integer pixel values for dynamically rendered elements,
   * such as: Tooltip, Reveal, and Dropdown
   * @function
   * @param {jQuery} element - jQuery object for the element being positioned.
   * @param {jQuery} anchor - jQuery object for the element's anchor point.
   * @param {String} position - a string relating to the desired position of the element, relative to it's anchor
   * @param {Number} vOffset - integer pixel value of desired vertical separation between anchor and element.
   * @param {Number} hOffset - integer pixel value of desired horizontal separation between anchor and element.
   * @param {Boolean} isOverflow - if a collision event is detected, sets to true to default the element to full width - any desired offset.
   * TODO alter/rewrite to work with `em` values as well/instead of pixels
   */
  function GetOffsets(element, anchor, position, vOffset, hOffset, isOverflow) {
    var $eleDims = GetDimensions(element),
        $anchorDims = anchor ? GetDimensions(anchor) : null;

    switch (position) {
      case 'top':
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top
        };
        break;
      case 'right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset,
          top: $anchorDims.offset.top
        };
        break;
      case 'center top':
        return {
          left: $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'center bottom':
        return {
          left: isOverflow ? hOffset : $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
        break;
      case 'center left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset + 1,
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center':
        return {
          left: $eleDims.windowDims.offset.left + $eleDims.windowDims.width / 2 - $eleDims.width / 2,
          top: $eleDims.windowDims.offset.top + $eleDims.windowDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'reveal':
        return {
          left: ($eleDims.windowDims.width - $eleDims.width) / 2,
          top: $eleDims.windowDims.offset.top + vOffset
        };
      case 'reveal full':
        return {
          left: $eleDims.windowDims.offset.left,
          top: $eleDims.windowDims.offset.top
        };
        break;
      case 'left bottom':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top + $anchorDims.height
        };
        break;
      case 'right bottom':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset - $eleDims.width,
          top: $anchorDims.offset.top + $anchorDims.height
        };
        break;
      default:
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
    }
  }
}(jQuery);
;/*******************************************
 *                                         *
 * This util was created by Marius Olbertz *
 * Please thank Marius on GitHub /owlbertz *
 * or the web http://www.mariusolbertz.de/ *
 *                                         *
 ******************************************/

'use strict';

!function ($) {

  var keyCodes = {
    9: 'TAB',
    13: 'ENTER',
    27: 'ESCAPE',
    32: 'SPACE',
    37: 'ARROW_LEFT',
    38: 'ARROW_UP',
    39: 'ARROW_RIGHT',
    40: 'ARROW_DOWN'
  };

  var commands = {};

  var Keyboard = {
    keys: getKeyCodes(keyCodes),

    /**
     * Parses the (keyboard) event and returns a String that represents its key
     * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
     * @param {Event} event - the event generated by the event handler
     * @return String key - String that represents the key pressed
     */
    parseKey: function (event) {
      var key = keyCodes[event.which || event.keyCode] || String.fromCharCode(event.which).toUpperCase();
      if (event.shiftKey) key = 'SHIFT_' + key;
      if (event.ctrlKey) key = 'CTRL_' + key;
      if (event.altKey) key = 'ALT_' + key;
      return key;
    },


    /**
     * Handles the given (keyboard) event
     * @param {Event} event - the event generated by the event handler
     * @param {String} component - Foundation component's name, e.g. Slider or Reveal
     * @param {Objects} functions - collection of functions that are to be executed
     */
    handleKey: function (event, component, functions) {
      var commandList = commands[component],
          keyCode = this.parseKey(event),
          cmds,
          command,
          fn;

      if (!commandList) return console.warn('Component not defined!');

      if (typeof commandList.ltr === 'undefined') {
        // this component does not differentiate between ltr and rtl
        cmds = commandList; // use plain list
      } else {
          // merge ltr and rtl: if document is rtl, rtl overwrites ltr and vice versa
          if (Foundation.rtl()) cmds = $.extend({}, commandList.ltr, commandList.rtl);else cmds = $.extend({}, commandList.rtl, commandList.ltr);
        }
      command = cmds[keyCode];

      fn = functions[command];
      if (fn && typeof fn === 'function') {
        // execute function  if exists
        fn.apply();
        if (functions.handled || typeof functions.handled === 'function') {
          // execute function when event was handled
          functions.handled.apply();
        }
      } else {
        if (functions.unhandled || typeof functions.unhandled === 'function') {
          // execute function when event was not handled
          functions.unhandled.apply();
        }
      }
    },


    /**
     * Finds all focusable elements within the given `$element`
     * @param {jQuery} $element - jQuery object to search within
     * @return {jQuery} $focusable - all focusable elements within `$element`
     */
    findFocusable: function ($element) {
      return $element.find('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]').filter(function () {
        if (!$(this).is(':visible') || $(this).attr('tabindex') < 0) {
          return false;
        } //only have visible elements and those that have a tabindex greater or equal 0
        return true;
      });
    },


    /**
     * Returns the component name name
     * @param {Object} component - Foundation component, e.g. Slider or Reveal
     * @return String componentName
     */

    register: function (componentName, cmds) {
      commands[componentName] = cmds;
    }
  };

  /*
   * Constants for easier comparing.
   * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
   */
  function getKeyCodes(kcs) {
    var k = {};
    for (var kc in kcs) {
      k[kcs[kc]] = kcs[kc];
    }return k;
  }

  Foundation.Keyboard = Keyboard;
}(jQuery);
;'use strict';

!function ($) {

  // Default set of media queries
  var defaultQueries = {
    'default': 'only screen',
    landscape: 'only screen and (orientation: landscape)',
    portrait: 'only screen and (orientation: portrait)',
    retina: 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 'only screen and (min--moz-device-pixel-ratio: 2),' + 'only screen and (-o-min-device-pixel-ratio: 2/1),' + 'only screen and (min-device-pixel-ratio: 2),' + 'only screen and (min-resolution: 192dpi),' + 'only screen and (min-resolution: 2dppx)'
  };

  var MediaQuery = {
    queries: [],

    current: '',

    /**
     * Initializes the media query helper, by extracting the breakpoint list from the CSS and activating the breakpoint watcher.
     * @function
     * @private
     */
    _init: function () {
      var self = this;
      var extractedStyles = $('.foundation-mq').css('font-family');
      var namedQueries;

      namedQueries = parseStyleToObject(extractedStyles);

      for (var key in namedQueries) {
        self.queries.push({
          name: key,
          value: 'only screen and (min-width: ' + namedQueries[key] + ')'
        });
      }

      this.current = this._getCurrentSize();

      this._watcher();
    },


    /**
     * Checks if the screen is at least as wide as a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to check.
     * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
     */
    atLeast: function (size) {
      var query = this.get(size);

      if (query) {
        return window.matchMedia(query).matches;
      }

      return false;
    },


    /**
     * Gets the media query of a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to get.
     * @returns {String|null} - The media query of the breakpoint, or `null` if the breakpoint doesn't exist.
     */
    get: function (size) {
      for (var i in this.queries) {
        var query = this.queries[i];
        if (size === query.name) return query.value;
      }

      return null;
    },


    /**
     * Gets the current breakpoint name by testing every breakpoint and returning the last one to match (the biggest one).
     * @function
     * @private
     * @returns {String} Name of the current breakpoint.
     */
    _getCurrentSize: function () {
      var matched;

      for (var i = 0; i < this.queries.length; i++) {
        var query = this.queries[i];

        if (window.matchMedia(query.value).matches) {
          matched = query;
        }
      }

      if (typeof matched === 'object') {
        return matched.name;
      } else {
        return matched;
      }
    },


    /**
     * Activates the breakpoint watcher, which fires an event on the window whenever the breakpoint changes.
     * @function
     * @private
     */
    _watcher: function () {
      var _this = this;

      $(window).on('resize.zf.mediaquery', function () {
        var newSize = _this._getCurrentSize();

        if (newSize !== _this.current) {
          // Broadcast the media query change on the window
          $(window).trigger('changed.zf.mediaquery', [newSize, _this.current]);

          // Change the current media query
          _this.current = newSize;
        }
      });
    }
  };

  Foundation.MediaQuery = MediaQuery;

  // matchMedia() polyfill - Test a CSS media type/query in JS.
  // Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license
  window.matchMedia || (window.matchMedia = function () {
    'use strict';

    // For browsers that support matchMedium api such as IE 9 and webkit

    var styleMedia = window.styleMedia || window.media;

    // For those that don't support matchMedium
    if (!styleMedia) {
      var style = document.createElement('style'),
          script = document.getElementsByTagName('script')[0],
          info = null;

      style.type = 'text/css';
      style.id = 'matchmediajs-test';

      script.parentNode.insertBefore(style, script);

      // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
      info = 'getComputedStyle' in window && window.getComputedStyle(style, null) || style.currentStyle;

      styleMedia = {
        matchMedium: function (media) {
          var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

          // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
          if (style.styleSheet) {
            style.styleSheet.cssText = text;
          } else {
            style.textContent = text;
          }

          // Test if media query is true or false
          return info.width === '1px';
        }
      };
    }

    return function (media) {
      return {
        matches: styleMedia.matchMedium(media || 'all'),
        media: media || 'all'
      };
    };
  }());

  // Thank you: https://github.com/sindresorhus/query-string
  function parseStyleToObject(str) {
    var styleObject = {};

    if (typeof str !== 'string') {
      return styleObject;
    }

    str = str.trim().slice(1, -1); // browsers re-quote string style values

    if (!str) {
      return styleObject;
    }

    styleObject = str.split('&').reduce(function (ret, param) {
      var parts = param.replace(/\+/g, ' ').split('=');
      var key = parts[0];
      var val = parts[1];
      key = decodeURIComponent(key);

      // missing `=` should be `null`:
      // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
      val = val === undefined ? null : decodeURIComponent(val);

      if (!ret.hasOwnProperty(key)) {
        ret[key] = val;
      } else if (Array.isArray(ret[key])) {
        ret[key].push(val);
      } else {
        ret[key] = [ret[key], val];
      }
      return ret;
    }, {});

    return styleObject;
  }

  Foundation.MediaQuery = MediaQuery;
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Motion module.
   * @module foundation.motion
   */

  var initClasses = ['mui-enter', 'mui-leave'];
  var activeClasses = ['mui-enter-active', 'mui-leave-active'];

  var Motion = {
    animateIn: function (element, animation, cb) {
      animate(true, element, animation, cb);
    },

    animateOut: function (element, animation, cb) {
      animate(false, element, animation, cb);
    }
  };

  function Move(duration, elem, fn) {
    var anim,
        prog,
        start = null;
    // console.log('called');

    function move(ts) {
      if (!start) start = window.performance.now();
      // console.log(start, ts);
      prog = ts - start;
      fn.apply(elem);

      if (prog < duration) {
        anim = window.requestAnimationFrame(move, elem);
      } else {
        window.cancelAnimationFrame(anim);
        elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
      }
    }
    anim = window.requestAnimationFrame(move);
  }

  /**
   * Animates an element in or out using a CSS transition class.
   * @function
   * @private
   * @param {Boolean} isIn - Defines if the animation is in or out.
   * @param {Object} element - jQuery or HTML object to animate.
   * @param {String} animation - CSS class to use.
   * @param {Function} cb - Callback to run when animation is finished.
   */
  function animate(isIn, element, animation, cb) {
    element = $(element).eq(0);

    if (!element.length) return;

    var initClass = isIn ? initClasses[0] : initClasses[1];
    var activeClass = isIn ? activeClasses[0] : activeClasses[1];

    // Set up the animation
    reset();

    element.addClass(animation).css('transition', 'none');

    requestAnimationFrame(function () {
      element.addClass(initClass);
      if (isIn) element.show();
    });

    // Start the animation
    requestAnimationFrame(function () {
      element[0].offsetWidth;
      element.css('transition', '').addClass(activeClass);
    });

    // Clean up the animation when it finishes
    element.one(Foundation.transitionend(element), finish);

    // Hides the element (for out animations), resets the element, and runs a callback
    function finish() {
      if (!isIn) element.hide();
      reset();
      if (cb) cb.apply(element);
    }

    // Resets transitions and removes motion-specific classes
    function reset() {
      element[0].style.transitionDuration = 0;
      element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
    }
  }

  Foundation.Move = Move;
  Foundation.Motion = Motion;
}(jQuery);
;'use strict';

!function ($) {

  var Nest = {
    Feather: function (menu) {
      var type = arguments.length <= 1 || arguments[1] === undefined ? 'zf' : arguments[1];

      menu.attr('role', 'menubar');

      var items = menu.find('li').attr({ 'role': 'menuitem' }),
          subMenuClass = 'is-' + type + '-submenu',
          subItemClass = subMenuClass + '-item',
          hasSubClass = 'is-' + type + '-submenu-parent';

      menu.find('a:first').attr('tabindex', 0);

      items.each(function () {
        var $item = $(this),
            $sub = $item.children('ul');

        if ($sub.length) {
          $item.addClass(hasSubClass).attr({
            'aria-haspopup': true,
            'aria-expanded': false,
            'aria-label': $item.children('a:first').text()
          });

          $sub.addClass('submenu ' + subMenuClass).attr({
            'data-submenu': '',
            'aria-hidden': true,
            'role': 'menu'
          });
        }

        if ($item.parent('[data-submenu]').length) {
          $item.addClass('is-submenu-item ' + subItemClass);
        }
      });

      return;
    },
    Burn: function (menu, type) {
      var items = menu.find('li').removeAttr('tabindex'),
          subMenuClass = 'is-' + type + '-submenu',
          subItemClass = subMenuClass + '-item',
          hasSubClass = 'is-' + type + '-submenu-parent';

      menu.find('*').removeClass(subMenuClass + ' ' + subItemClass + ' ' + hasSubClass + ' is-submenu-item submenu is-active').removeAttr('data-submenu').css('display', '');

      // console.log(      menu.find('.' + subMenuClass + ', .' + subItemClass + ', .has-submenu, .is-submenu-item, .submenu, [data-submenu]')
      //           .removeClass(subMenuClass + ' ' + subItemClass + ' has-submenu is-submenu-item submenu')
      //           .removeAttr('data-submenu'));
      // items.each(function(){
      //   var $item = $(this),
      //       $sub = $item.children('ul');
      //   if($item.parent('[data-submenu]').length){
      //     $item.removeClass('is-submenu-item ' + subItemClass);
      //   }
      //   if($sub.length){
      //     $item.removeClass('has-submenu');
      //     $sub.removeClass('submenu ' + subMenuClass).removeAttr('data-submenu');
      //   }
      // });
    }
  };

  Foundation.Nest = Nest;
}(jQuery);
;'use strict';

!function ($) {

  function Timer(elem, options, cb) {
    var _this = this,
        duration = options.duration,
        //options is an object for easily adding features later.
    nameSpace = Object.keys(elem.data())[0] || 'timer',
        remain = -1,
        start,
        timer;

    this.isPaused = false;

    this.restart = function () {
      remain = -1;
      clearTimeout(timer);
      this.start();
    };

    this.start = function () {
      this.isPaused = false;
      // if(!elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      remain = remain <= 0 ? duration : remain;
      elem.data('paused', false);
      start = Date.now();
      timer = setTimeout(function () {
        if (options.infinite) {
          _this.restart(); //rerun the timer.
        }
        cb();
      }, remain);
      elem.trigger('timerstart.zf.' + nameSpace);
    };

    this.pause = function () {
      this.isPaused = true;
      //if(elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      elem.data('paused', true);
      var end = Date.now();
      remain = remain - (end - start);
      elem.trigger('timerpaused.zf.' + nameSpace);
    };
  }

  /**
   * Runs a callback function when images are fully loaded.
   * @param {Object} images - Image(s) to check if loaded.
   * @param {Func} callback - Function to execute when image is fully loaded.
   */
  function onImagesLoaded(images, callback) {
    var self = this,
        unloaded = images.length;

    if (unloaded === 0) {
      callback();
    }

    images.each(function () {
      if (this.complete) {
        singleImageLoaded();
      } else if (typeof this.naturalWidth !== 'undefined' && this.naturalWidth > 0) {
        singleImageLoaded();
      } else {
        $(this).one('load', function () {
          singleImageLoaded();
        });
      }
    });

    function singleImageLoaded() {
      unloaded--;
      if (unloaded === 0) {
        callback();
      }
    }
  }

  Foundation.Timer = Timer;
  Foundation.onImagesLoaded = onImagesLoaded;
}(jQuery);
;//**************************************************
//**Work inspired by multiple jquery swipe plugins**
//**Done by Yohai Ararat ***************************
//**************************************************
(function ($) {

	$.spotSwipe = {
		version: '1.0.0',
		enabled: 'ontouchstart' in document.documentElement,
		preventDefault: false,
		moveThreshold: 75,
		timeThreshold: 200
	};

	var startPosX,
	    startPosY,
	    startTime,
	    elapsedTime,
	    isMoving = false;

	function onTouchEnd() {
		//  alert(this);
		this.removeEventListener('touchmove', onTouchMove);
		this.removeEventListener('touchend', onTouchEnd);
		isMoving = false;
	}

	function onTouchMove(e) {
		if ($.spotSwipe.preventDefault) {
			e.preventDefault();
		}
		if (isMoving) {
			var x = e.touches[0].pageX;
			var y = e.touches[0].pageY;
			var dx = startPosX - x;
			var dy = startPosY - y;
			var dir;
			elapsedTime = new Date().getTime() - startTime;
			if (Math.abs(dx) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
				dir = dx > 0 ? 'left' : 'right';
			}
			// else if(Math.abs(dy) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
			//   dir = dy > 0 ? 'down' : 'up';
			// }
			if (dir) {
				e.preventDefault();
				onTouchEnd.call(this);
				$(this).trigger('swipe', dir).trigger('swipe' + dir);
			}
		}
	}

	function onTouchStart(e) {
		if (e.touches.length == 1) {
			startPosX = e.touches[0].pageX;
			startPosY = e.touches[0].pageY;
			isMoving = true;
			startTime = new Date().getTime();
			this.addEventListener('touchmove', onTouchMove, false);
			this.addEventListener('touchend', onTouchEnd, false);
		}
	}

	function init() {
		this.addEventListener && this.addEventListener('touchstart', onTouchStart, false);
	}

	function teardown() {
		this.removeEventListener('touchstart', onTouchStart);
	}

	$.event.special.swipe = { setup: init };

	$.each(['left', 'up', 'down', 'right'], function () {
		$.event.special['swipe' + this] = { setup: function () {
				$(this).on('swipe', $.noop);
			} };
	});
})(jQuery);
/****************************************************
 * Method for adding psuedo drag events to elements *
 ***************************************************/
!function ($) {
	$.fn.addTouch = function () {
		this.each(function (i, el) {
			$(el).bind('touchstart touchmove touchend touchcancel', function () {
				//we pass the original event object because the jQuery event
				//object is normalized to w3c specs and does not provide the TouchList
				handleTouch(event);
			});
		});

		var handleTouch = function (event) {
			var touches = event.changedTouches,
			    first = touches[0],
			    eventTypes = {
				touchstart: 'mousedown',
				touchmove: 'mousemove',
				touchend: 'mouseup'
			},
			    type = eventTypes[event.type],
			    simulatedEvent;

			if ('MouseEvent' in window && typeof window.MouseEvent === 'function') {
				simulatedEvent = window.MouseEvent(type, {
					'bubbles': true,
					'cancelable': true,
					'screenX': first.screenX,
					'screenY': first.screenY,
					'clientX': first.clientX,
					'clientY': first.clientY
				});
			} else {
				simulatedEvent = document.createEvent('MouseEvent');
				simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0 /*left*/, null);
			}
			first.target.dispatchEvent(simulatedEvent);
		};
	};
}(jQuery);

//**********************************
//**From the jQuery Mobile Library**
//**need to recreate functionality**
//**and try to improve if possible**
//**********************************

/* Removing the jQuery function ****
************************************

(function( $, window, undefined ) {

	var $document = $( document ),
		// supportTouch = $.mobile.support.touch,
		touchStartEvent = 'touchstart'//supportTouch ? "touchstart" : "mousedown",
		touchStopEvent = 'touchend'//supportTouch ? "touchend" : "mouseup",
		touchMoveEvent = 'touchmove'//supportTouch ? "touchmove" : "mousemove";

	// setup new event shortcuts
	$.each( ( "touchstart touchmove touchend " +
		"swipe swipeleft swiperight" ).split( " " ), function( i, name ) {

		$.fn[ name ] = function( fn ) {
			return fn ? this.bind( name, fn ) : this.trigger( name );
		};

		// jQuery < 1.8
		if ( $.attrFn ) {
			$.attrFn[ name ] = true;
		}
	});

	function triggerCustomEvent( obj, eventType, event, bubble ) {
		var originalType = event.type;
		event.type = eventType;
		if ( bubble ) {
			$.event.trigger( event, undefined, obj );
		} else {
			$.event.dispatch.call( obj, event );
		}
		event.type = originalType;
	}

	// also handles taphold

	// Also handles swipeleft, swiperight
	$.event.special.swipe = {

		// More than this horizontal displacement, and we will suppress scrolling.
		scrollSupressionThreshold: 30,

		// More time than this, and it isn't a swipe.
		durationThreshold: 1000,

		// Swipe horizontal displacement must be more than this.
		horizontalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		// Swipe vertical displacement must be less than this.
		verticalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		getLocation: function ( event ) {
			var winPageX = window.pageXOffset,
				winPageY = window.pageYOffset,
				x = event.clientX,
				y = event.clientY;

			if ( event.pageY === 0 && Math.floor( y ) > Math.floor( event.pageY ) ||
				event.pageX === 0 && Math.floor( x ) > Math.floor( event.pageX ) ) {

				// iOS4 clientX/clientY have the value that should have been
				// in pageX/pageY. While pageX/page/ have the value 0
				x = x - winPageX;
				y = y - winPageY;
			} else if ( y < ( event.pageY - winPageY) || x < ( event.pageX - winPageX ) ) {

				// Some Android browsers have totally bogus values for clientX/Y
				// when scrolling/zooming a page. Detectable since clientX/clientY
				// should never be smaller than pageX/pageY minus page scroll
				x = event.pageX - winPageX;
				y = event.pageY - winPageY;
			}

			return {
				x: x,
				y: y
			};
		},

		start: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ],
						origin: $( event.target )
					};
		},

		stop: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ]
					};
		},

		handleSwipe: function( start, stop, thisObject, origTarget ) {
			if ( stop.time - start.time < $.event.special.swipe.durationThreshold &&
				Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.horizontalDistanceThreshold &&
				Math.abs( start.coords[ 1 ] - stop.coords[ 1 ] ) < $.event.special.swipe.verticalDistanceThreshold ) {
				var direction = start.coords[0] > stop.coords[ 0 ] ? "swipeleft" : "swiperight";

				triggerCustomEvent( thisObject, "swipe", $.Event( "swipe", { target: origTarget, swipestart: start, swipestop: stop }), true );
				triggerCustomEvent( thisObject, direction,$.Event( direction, { target: origTarget, swipestart: start, swipestop: stop } ), true );
				return true;
			}
			return false;

		},

		// This serves as a flag to ensure that at most one swipe event event is
		// in work at any given time
		eventInProgress: false,

		setup: function() {
			var events,
				thisObject = this,
				$this = $( thisObject ),
				context = {};

			// Retrieve the events data for this element and add the swipe context
			events = $.data( this, "mobile-events" );
			if ( !events ) {
				events = { length: 0 };
				$.data( this, "mobile-events", events );
			}
			events.length++;
			events.swipe = context;

			context.start = function( event ) {

				// Bail if we're already working on a swipe event
				if ( $.event.special.swipe.eventInProgress ) {
					return;
				}
				$.event.special.swipe.eventInProgress = true;

				var stop,
					start = $.event.special.swipe.start( event ),
					origTarget = event.target,
					emitted = false;

				context.move = function( event ) {
					if ( !start || event.isDefaultPrevented() ) {
						return;
					}

					stop = $.event.special.swipe.stop( event );
					if ( !emitted ) {
						emitted = $.event.special.swipe.handleSwipe( start, stop, thisObject, origTarget );
						if ( emitted ) {

							// Reset the context to make way for the next swipe event
							$.event.special.swipe.eventInProgress = false;
						}
					}
					// prevent scrolling
					if ( Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.scrollSupressionThreshold ) {
						event.preventDefault();
					}
				};

				context.stop = function() {
						emitted = true;

						// Reset the context to make way for the next swipe event
						$.event.special.swipe.eventInProgress = false;
						$document.off( touchMoveEvent, context.move );
						context.move = null;
				};

				$document.on( touchMoveEvent, context.move )
					.one( touchStopEvent, context.stop );
			};
			$this.on( touchStartEvent, context.start );
		},

		teardown: function() {
			var events, context;

			events = $.data( this, "mobile-events" );
			if ( events ) {
				context = events.swipe;
				delete events.swipe;
				events.length--;
				if ( events.length === 0 ) {
					$.removeData( this, "mobile-events" );
				}
			}

			if ( context ) {
				if ( context.start ) {
					$( this ).off( touchStartEvent, context.start );
				}
				if ( context.move ) {
					$document.off( touchMoveEvent, context.move );
				}
				if ( context.stop ) {
					$document.off( touchStopEvent, context.stop );
				}
			}
		}
	};
	$.each({
		swipeleft: "swipe.left",
		swiperight: "swipe.right"
	}, function( event, sourceEvent ) {

		$.event.special[ event ] = {
			setup: function() {
				$( this ).bind( sourceEvent, $.noop );
			},
			teardown: function() {
				$( this ).unbind( sourceEvent );
			}
		};
	});
})( jQuery, this );
*/
;'use strict';

!function ($) {

  var MutationObserver = function () {
    var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
    for (var i = 0; i < prefixes.length; i++) {
      if (prefixes[i] + 'MutationObserver' in window) {
        return window[prefixes[i] + 'MutationObserver'];
      }
    }
    return false;
  }();

  var triggers = function (el, type) {
    el.data(type).split(' ').forEach(function (id) {
      $('#' + id)[type === 'close' ? 'trigger' : 'triggerHandler'](type + '.zf.trigger', [el]);
    });
  };
  // Elements with [data-open] will reveal a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-open]', function () {
    triggers($(this), 'open');
  });

  // Elements with [data-close] will close a plugin that supports it when clicked.
  // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
  $(document).on('click.zf.trigger', '[data-close]', function () {
    var id = $(this).data('close');
    if (id) {
      triggers($(this), 'close');
    } else {
      $(this).trigger('close.zf.trigger');
    }
  });

  // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-toggle]', function () {
    triggers($(this), 'toggle');
  });

  // Elements with [data-closable] will respond to close.zf.trigger events.
  $(document).on('close.zf.trigger', '[data-closable]', function (e) {
    e.stopPropagation();
    var animation = $(this).data('closable');

    if (animation !== '') {
      Foundation.Motion.animateOut($(this), animation, function () {
        $(this).trigger('closed.zf');
      });
    } else {
      $(this).fadeOut().trigger('closed.zf');
    }
  });

  $(document).on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', function () {
    var id = $(this).data('toggle-focus');
    $('#' + id).triggerHandler('toggle.zf.trigger', [$(this)]);
  });

  /**
  * Fires once after all other scripts have loaded
  * @function
  * @private
  */
  $(window).load(function () {
    checkListeners();
  });

  function checkListeners() {
    eventsListener();
    resizeListener();
    scrollListener();
    closemeListener();
  }

  //******** only fires this function once on load, if there's something to watch ********
  function closemeListener(pluginName) {
    var yetiBoxes = $('[data-yeti-box]'),
        plugNames = ['dropdown', 'tooltip', 'reveal'];

    if (pluginName) {
      if (typeof pluginName === 'string') {
        plugNames.push(pluginName);
      } else if (typeof pluginName === 'object' && typeof pluginName[0] === 'string') {
        plugNames.concat(pluginName);
      } else {
        console.error('Plugin names must be strings');
      }
    }
    if (yetiBoxes.length) {
      var listeners = plugNames.map(function (name) {
        return 'closeme.zf.' + name;
      }).join(' ');

      $(window).off(listeners).on(listeners, function (e, pluginId) {
        var plugin = e.namespace.split('.')[0];
        var plugins = $('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');

        plugins.each(function () {
          var _this = $(this);

          _this.triggerHandler('close.zf.trigger', [_this]);
        });
      });
    }
  }

  function resizeListener(debounce) {
    var timer = void 0,
        $nodes = $('[data-resize]');
    if ($nodes.length) {
      $(window).off('resize.zf.trigger').on('resize.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('resizeme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a resize event
          $nodes.attr('data-events', "resize");
        }, debounce || 10); //default time to emit resize event
      });
    }
  }

  function scrollListener(debounce) {
    var timer = void 0,
        $nodes = $('[data-scroll]');
    if ($nodes.length) {
      $(window).off('scroll.zf.trigger').on('scroll.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('scrollme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a scroll event
          $nodes.attr('data-events', "scroll");
        }, debounce || 10); //default time to emit scroll event
      });
    }
  }

  function eventsListener() {
    if (!MutationObserver) {
      return false;
    }
    var nodes = document.querySelectorAll('[data-resize], [data-scroll], [data-mutate]');

    //element callback
    var listeningElementsMutation = function (mutationRecordsList) {
      var $target = $(mutationRecordsList[0].target);
      //trigger the event handler for the element depending on type
      switch ($target.attr("data-events")) {

        case "resize":
          $target.triggerHandler('resizeme.zf.trigger', [$target]);
          break;

        case "scroll":
          $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
          break;

        // case "mutate" :
        // console.log('mutate', $target);
        // $target.triggerHandler('mutate.zf.trigger');
        //
        // //make sure we don't get stuck in an infinite loop from sloppy codeing
        // if ($target.index('[data-mutate]') == $("[data-mutate]").length-1) {
        //   domMutationObserver();
        // }
        // break;

        default:
          return false;
        //nothing
      }
    };

    if (nodes.length) {
      //for each element that needs to listen for resizing, scrolling, (or coming soon mutation) add a single observer
      for (var i = 0; i <= nodes.length - 1; i++) {
        var elementObserver = new MutationObserver(listeningElementsMutation);
        elementObserver.observe(nodes[i], { attributes: true, childList: false, characterData: false, subtree: false, attributeFilter: ["data-events"] });
      }
    }
  }

  // ------------------------------------

  // [PH]
  // Foundation.CheckWatchers = checkWatchers;
  Foundation.IHearYou = checkListeners;
  // Foundation.ISeeYou = scrollListener;
  // Foundation.IFeelYou = closemeListener;
}(jQuery);

// function domMutationObserver(debounce) {
//   // !!! This is coming soon and needs more work; not active  !!! //
//   var timer,
//   nodes = document.querySelectorAll('[data-mutate]');
//   //
//   if (nodes.length) {
//     // var MutationObserver = (function () {
//     //   var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
//     //   for (var i=0; i < prefixes.length; i++) {
//     //     if (prefixes[i] + 'MutationObserver' in window) {
//     //       return window[prefixes[i] + 'MutationObserver'];
//     //     }
//     //   }
//     //   return false;
//     // }());
//
//
//     //for the body, we need to listen for all changes effecting the style and class attributes
//     var bodyObserver = new MutationObserver(bodyMutation);
//     bodyObserver.observe(document.body, { attributes: true, childList: true, characterData: false, subtree:true, attributeFilter:["style", "class"]});
//
//
//     //body callback
//     function bodyMutation(mutate) {
//       //trigger all listening elements and signal a mutation event
//       if (timer) { clearTimeout(timer); }
//
//       timer = setTimeout(function() {
//         bodyObserver.disconnect();
//         $('[data-mutate]').attr('data-events',"mutate");
//       }, debounce || 150);
//     }
//   }
// }
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Abide module.
   * @module foundation.abide
   */

  var Abide = function () {
    /**
     * Creates a new instance of Abide.
     * @class
     * @fires Abide#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Abide(element) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _classCallCheck(this, Abide);

      this.$element = element;
      this.options = $.extend({}, Abide.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Abide');
    }

    /**
     * Initializes the Abide plugin and calls functions to get Abide functioning on load.
     * @private
     */


    _createClass(Abide, [{
      key: '_init',
      value: function _init() {
        this.$inputs = this.$element.find('input, textarea, select').not('[data-abide-ignore]');

        this._events();
      }

      /**
       * Initializes events for Abide.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this2 = this;

        this.$element.off('.abide').on('reset.zf.abide', function () {
          _this2.resetForm();
        }).on('submit.zf.abide', function () {
          return _this2.validateForm();
        });

        if (this.options.validateOn === 'fieldChange') {
          this.$inputs.off('change.zf.abide').on('change.zf.abide', function (e) {
            _this2.validateInput($(e.target));
          });
        }

        if (this.options.liveValidate) {
          this.$inputs.off('input.zf.abide').on('input.zf.abide', function (e) {
            _this2.validateInput($(e.target));
          });
        }
      }

      /**
       * Calls necessary functions to update Abide upon DOM change
       * @private
       */

    }, {
      key: '_reflow',
      value: function _reflow() {
        this._init();
      }

      /**
       * Checks whether or not a form element has the required attribute and if it's checked or not
       * @param {Object} element - jQuery object to check for required attribute
       * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
       */

    }, {
      key: 'requiredCheck',
      value: function requiredCheck($el) {
        if (!$el.attr('required')) return true;

        var isGood = true;

        switch ($el[0].type) {
          case 'select':
          case 'select-one':
          case 'select-multiple':
            var opt = $el.find('option:selected');
            if (!opt.length || !opt.val()) isGood = false;
            break;

          default:
            if (!$el.val() || !$el.val().length) isGood = false;
        }

        return isGood;
      }

      /**
       * Based on $el, get the first element with selector in this order:
       * 1. The element's direct sibling('s).
       * 3. The element's parent's children.
       *
       * This allows for multiple form errors per input, though if none are found, no form errors will be shown.
       *
       * @param {Object} $el - jQuery object to use as reference to find the form error selector.
       * @returns {Object} jQuery object with the selector.
       */

    }, {
      key: 'findFormError',
      value: function findFormError($el) {
        var $error = $el.siblings(this.options.formErrorSelector);

        if (!$error.length) {
          $error = $el.parent().find(this.options.formErrorSelector);
        }

        return $error;
      }

      /**
       * Get the first element in this order:
       * 2. The <label> with the attribute `[for="someInputId"]`
       * 3. The `.closest()` <label>
       *
       * @param {Object} $el - jQuery object to check for required attribute
       * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
       */

    }, {
      key: 'findLabel',
      value: function findLabel($el) {
        var id = $el[0].id;
        var $label = this.$element.find('label[for="' + id + '"]');

        if (!$label.length) {
          return $el.closest('label');
        }

        return $label;
      }

      /**
       * Get the set of labels associated with a set of radio els in this order
       * 2. The <label> with the attribute `[for="someInputId"]`
       * 3. The `.closest()` <label>
       *
       * @param {Object} $el - jQuery object to check for required attribute
       * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
       */

    }, {
      key: 'findRadioLabels',
      value: function findRadioLabels($els) {
        var _this3 = this;

        var labels = $els.map(function (i, el) {
          var id = el.id;
          var $label = _this3.$element.find('label[for="' + id + '"]');

          if (!$label.length) {
            $label = $(el).closest('label');
          }
          return $label[0];
        });

        return $(labels);
      }

      /**
       * Adds the CSS error class as specified by the Abide settings to the label, input, and the form
       * @param {Object} $el - jQuery object to add the class to
       */

    }, {
      key: 'addErrorClasses',
      value: function addErrorClasses($el) {
        var $label = this.findLabel($el);
        var $formError = this.findFormError($el);

        if ($label.length) {
          $label.addClass(this.options.labelErrorClass);
        }

        if ($formError.length) {
          $formError.addClass(this.options.formErrorClass);
        }

        $el.addClass(this.options.inputErrorClass).attr('data-invalid', '');
      }

      /**
       * Remove CSS error classes etc from an entire radio button group
       * @param {String} groupName - A string that specifies the name of a radio button group
       *
       */

    }, {
      key: 'removeRadioErrorClasses',
      value: function removeRadioErrorClasses(groupName) {
        var $els = this.$element.find(':radio[name="' + groupName + '"]');
        var $labels = this.findRadioLabels($els);
        var $formErrors = this.findFormError($els);

        if ($labels.length) {
          $labels.removeClass(this.options.labelErrorClass);
        }

        if ($formErrors.length) {
          $formErrors.removeClass(this.options.formErrorClass);
        }

        $els.removeClass(this.options.inputErrorClass).removeAttr('data-invalid');
      }

      /**
       * Removes CSS error class as specified by the Abide settings from the label, input, and the form
       * @param {Object} $el - jQuery object to remove the class from
       */

    }, {
      key: 'removeErrorClasses',
      value: function removeErrorClasses($el) {
        // radios need to clear all of the els
        if ($el[0].type == 'radio') {
          return this.removeRadioErrorClasses($el.attr('name'));
        }

        var $label = this.findLabel($el);
        var $formError = this.findFormError($el);

        if ($label.length) {
          $label.removeClass(this.options.labelErrorClass);
        }

        if ($formError.length) {
          $formError.removeClass(this.options.formErrorClass);
        }

        $el.removeClass(this.options.inputErrorClass).removeAttr('data-invalid');
      }

      /**
       * Goes through a form to find inputs and proceeds to validate them in ways specific to their type
       * @fires Abide#invalid
       * @fires Abide#valid
       * @param {Object} element - jQuery object to validate, should be an HTML input
       * @returns {Boolean} goodToGo - If the input is valid or not.
       */

    }, {
      key: 'validateInput',
      value: function validateInput($el) {
        var clearRequire = this.requiredCheck($el),
            validated = false,
            customValidator = true,
            validator = $el.attr('data-validator'),
            equalTo = true;

        switch ($el[0].type) {
          case 'radio':
            validated = this.validateRadio($el.attr('name'));
            break;

          case 'checkbox':
            validated = clearRequire;
            break;

          case 'select':
          case 'select-one':
          case 'select-multiple':
            validated = clearRequire;
            break;

          default:
            validated = this.validateText($el);
        }

        if (validator) {
          customValidator = this.matchValidation($el, validator, $el.attr('required'));
        }

        if ($el.attr('data-equalto')) {
          equalTo = this.options.validators.equalTo($el);
        }

        var goodToGo = [clearRequire, validated, customValidator, equalTo].indexOf(false) === -1;
        var message = (goodToGo ? 'valid' : 'invalid') + '.zf.abide';

        this[goodToGo ? 'removeErrorClasses' : 'addErrorClasses']($el);

        /**
         * Fires when the input is done checking for validation. Event trigger is either `valid.zf.abide` or `invalid.zf.abide`
         * Trigger includes the DOM element of the input.
         * @event Abide#valid
         * @event Abide#invalid
         */
        $el.trigger(message, [$el]);

        return goodToGo;
      }

      /**
       * Goes through a form and if there are any invalid inputs, it will display the form error element
       * @returns {Boolean} noError - true if no errors were detected...
       * @fires Abide#formvalid
       * @fires Abide#forminvalid
       */

    }, {
      key: 'validateForm',
      value: function validateForm() {
        var acc = [];
        var _this = this;

        this.$inputs.each(function () {
          acc.push(_this.validateInput($(this)));
        });

        var noError = acc.indexOf(false) === -1;

        this.$element.find('[data-abide-error]').css('display', noError ? 'none' : 'block');

        /**
         * Fires when the form is finished validating. Event trigger is either `formvalid.zf.abide` or `forminvalid.zf.abide`.
         * Trigger includes the element of the form.
         * @event Abide#formvalid
         * @event Abide#forminvalid
         */
        this.$element.trigger((noError ? 'formvalid' : 'forminvalid') + '.zf.abide', [this.$element]);

        return noError;
      }

      /**
       * Determines whether or a not a text input is valid based on the pattern specified in the attribute. If no matching pattern is found, returns true.
       * @param {Object} $el - jQuery object to validate, should be a text input HTML element
       * @param {String} pattern - string value of one of the RegEx patterns in Abide.options.patterns
       * @returns {Boolean} Boolean value depends on whether or not the input value matches the pattern specified
       */

    }, {
      key: 'validateText',
      value: function validateText($el, pattern) {
        // A pattern can be passed to this function, or it will be infered from the input's "pattern" attribute, or it's "type" attribute
        pattern = pattern || $el.attr('pattern') || $el.attr('type');
        var inputText = $el.val();
        var valid = false;

        if (inputText.length) {
          // If the pattern attribute on the element is in Abide's list of patterns, then test that regexp
          if (this.options.patterns.hasOwnProperty(pattern)) {
            valid = this.options.patterns[pattern].test(inputText);
          }
          // If the pattern name isn't also the type attribute of the field, then test it as a regexp
          else if (pattern !== $el.attr('type')) {
              valid = new RegExp(pattern).test(inputText);
            } else {
              valid = true;
            }
        }
        // An empty field is valid if it's not required
        else if (!$el.prop('required')) {
            valid = true;
          }

        return valid;
      }

      /**
       * Determines whether or a not a radio input is valid based on whether or not it is required and selected. Although the function targets a single `<input>`, it validates by checking the `required` and `checked` properties of all radio buttons in its group.
       * @param {String} groupName - A string that specifies the name of a radio button group
       * @returns {Boolean} Boolean value depends on whether or not at least one radio input has been selected (if it's required)
       */

    }, {
      key: 'validateRadio',
      value: function validateRadio(groupName) {
        // If at least one radio in the group has the `required` attribute, the group is considered required
        // Per W3C spec, all radio buttons in a group should have `required`, but we're being nice
        var $group = this.$element.find(':radio[name="' + groupName + '"]');
        var valid = false;

        // .attr() returns undefined if no elements in $group have the attribute "required"
        if ($group.attr('required') === undefined) {
          valid = true;
        }

        // For the group to be valid, at least one radio needs to be checked
        $group.each(function (i, e) {
          if ($(e).prop('checked')) {
            valid = true;
          }
        });

        return valid;
      }

      /**
       * Determines if a selected input passes a custom validation function. Multiple validations can be used, if passed to the element with `data-validator="foo bar baz"` in a space separated listed.
       * @param {Object} $el - jQuery input element.
       * @param {String} validators - a string of function names matching functions in the Abide.options.validators object.
       * @param {Boolean} required - self explanatory?
       * @returns {Boolean} - true if validations passed.
       */

    }, {
      key: 'matchValidation',
      value: function matchValidation($el, validators, required) {
        var _this4 = this;

        required = required ? true : false;

        var clear = validators.split(' ').map(function (v) {
          return _this4.options.validators[v]($el, required, $el.parent());
        });
        return clear.indexOf(false) === -1;
      }

      /**
       * Resets form inputs and styles
       * @fires Abide#formreset
       */

    }, {
      key: 'resetForm',
      value: function resetForm() {
        var $form = this.$element,
            opts = this.options;

        $('.' + opts.labelErrorClass, $form).not('small').removeClass(opts.labelErrorClass);
        $('.' + opts.inputErrorClass, $form).not('small').removeClass(opts.inputErrorClass);
        $(opts.formErrorSelector + '.' + opts.formErrorClass).removeClass(opts.formErrorClass);
        $form.find('[data-abide-error]').css('display', 'none');
        $(':input', $form).not(':button, :submit, :reset, :hidden, [data-abide-ignore]').val('').removeAttr('data-invalid');
        /**
         * Fires when the form has been reset.
         * @event Abide#formreset
         */
        $form.trigger('formreset.zf.abide', [$form]);
      }

      /**
       * Destroys an instance of Abide.
       * Removes error styles and classes from elements, without resetting their values.
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        var _this = this;
        this.$element.off('.abide').find('[data-abide-error]').css('display', 'none');

        this.$inputs.off('.abide').each(function () {
          _this.removeErrorClasses($(this));
        });

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Abide;
  }();

  /**
   * Default settings for plugin
   */


  Abide.defaults = {
    /**
     * The default event to validate inputs. Checkboxes and radios validate immediately.
     * Remove or change this value for manual validation.
     * @option
     * @example 'fieldChange'
     */
    validateOn: 'fieldChange',

    /**
     * Class to be applied to input labels on failed validation.
     * @option
     * @example 'is-invalid-label'
     */
    labelErrorClass: 'is-invalid-label',

    /**
     * Class to be applied to inputs on failed validation.
     * @option
     * @example 'is-invalid-input'
     */
    inputErrorClass: 'is-invalid-input',

    /**
     * Class selector to use to target Form Errors for show/hide.
     * @option
     * @example '.form-error'
     */
    formErrorSelector: '.form-error',

    /**
     * Class added to Form Errors on failed validation.
     * @option
     * @example 'is-visible'
     */
    formErrorClass: 'is-visible',

    /**
     * Set to true to validate text inputs on any value change.
     * @option
     * @example false
     */
    liveValidate: false,

    patterns: {
      alpha: /^[a-zA-Z]+$/,
      alpha_numeric: /^[a-zA-Z0-9]+$/,
      integer: /^[-+]?\d+$/,
      number: /^[-+]?\d*(?:[\.\,]\d+)?$/,

      // amex, visa, diners
      card: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
      cvv: /^([0-9]){3,4}$/,

      // http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
      email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,

      url: /^(https?|ftp|file|ssh):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/,
      // abc.de
      domain: /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8}$/,

      datetime: /^([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))$/,
      // YYYY-MM-DD
      date: /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/,
      // HH:MM:SS
      time: /^(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/,
      dateISO: /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
      // MM/DD/YYYY
      month_day_year: /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.]\d{4}$/,
      // DD/MM/YYYY
      day_month_year: /^(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.]\d{4}$/,

      // #FFF or #FFFFFF
      color: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/
    },

    /**
     * Optional validation functions to be used. `equalTo` being the only default included function.
     * Functions should return only a boolean if the input is valid or not. Functions are given the following arguments:
     * el : The jQuery element to validate.
     * required : Boolean value of the required attribute be present or not.
     * parent : The direct parent of the input.
     * @option
     */
    validators: {
      equalTo: function (el, required, parent) {
        return $('#' + el.attr('data-equalto')).val() === el.val();
      }
    }
  };

  // Window exports
  Foundation.plugin(Abide, 'Abide');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Accordion module.
   * @module foundation.accordion
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   */

  var Accordion = function () {
    /**
     * Creates a new instance of an accordion.
     * @class
     * @fires Accordion#init
     * @param {jQuery} element - jQuery object to make into an accordion.
     * @param {Object} options - a plain object with settings to override the default options.
     */

    function Accordion(element, options) {
      _classCallCheck(this, Accordion);

      this.$element = element;
      this.options = $.extend({}, Accordion.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Accordion');
      Foundation.Keyboard.register('Accordion', {
        'ENTER': 'toggle',
        'SPACE': 'toggle',
        'ARROW_DOWN': 'next',
        'ARROW_UP': 'previous'
      });
    }

    /**
     * Initializes the accordion by animating the preset active pane(s).
     * @private
     */


    _createClass(Accordion, [{
      key: '_init',
      value: function _init() {
        this.$element.attr('role', 'tablist');
        this.$tabs = this.$element.children('li, [data-accordion-item]');

        this.$tabs.each(function (idx, el) {
          var $el = $(el),
              $content = $el.children('[data-tab-content]'),
              id = $content[0].id || Foundation.GetYoDigits(6, 'accordion'),
              linkId = el.id || id + '-label';

          $el.find('a:first').attr({
            'aria-controls': id,
            'role': 'tab',
            'id': linkId,
            'aria-expanded': false,
            'aria-selected': false
          });

          $content.attr({ 'role': 'tabpanel', 'aria-labelledby': linkId, 'aria-hidden': true, 'id': id });
        });
        var $initActive = this.$element.find('.is-active').children('[data-tab-content]');
        if ($initActive.length) {
          this.down($initActive, true);
        }
        this._events();
      }

      /**
       * Adds event handlers for items within the accordion.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        this.$tabs.each(function () {
          var $elem = $(this);
          var $tabContent = $elem.children('[data-tab-content]');
          if ($tabContent.length) {
            $elem.children('a').off('click.zf.accordion keydown.zf.accordion').on('click.zf.accordion', function (e) {
              // $(this).children('a').on('click.zf.accordion', function(e) {
              e.preventDefault();
              if ($elem.hasClass('is-active')) {
                if (_this.options.allowAllClosed || $elem.siblings().hasClass('is-active')) {
                  _this.up($tabContent);
                }
              } else {
                _this.down($tabContent);
              }
            }).on('keydown.zf.accordion', function (e) {
              Foundation.Keyboard.handleKey(e, 'Accordion', {
                toggle: function () {
                  _this.toggle($tabContent);
                },
                next: function () {
                  var $a = $elem.next().find('a').focus();
                  if (!_this.options.multiExpand) {
                    $a.trigger('click.zf.accordion');
                  }
                },
                previous: function () {
                  var $a = $elem.prev().find('a').focus();
                  if (!_this.options.multiExpand) {
                    $a.trigger('click.zf.accordion');
                  }
                },
                handled: function () {
                  e.preventDefault();
                  e.stopPropagation();
                }
              });
            });
          }
        });
      }

      /**
       * Toggles the selected content pane's open/close state.
       * @param {jQuery} $target - jQuery object of the pane to toggle.
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle($target) {
        if ($target.parent().hasClass('is-active')) {
          if (this.options.allowAllClosed || $target.parent().siblings().hasClass('is-active')) {
            this.up($target);
          } else {
            return;
          }
        } else {
          this.down($target);
        }
      }

      /**
       * Opens the accordion tab defined by `$target`.
       * @param {jQuery} $target - Accordion pane to open.
       * @param {Boolean} firstTime - flag to determine if reflow should happen.
       * @fires Accordion#down
       * @function
       */

    }, {
      key: 'down',
      value: function down($target, firstTime) {
        var _this2 = this;

        if (!this.options.multiExpand && !firstTime) {
          var $currentActive = this.$element.children('.is-active').children('[data-tab-content]');
          if ($currentActive.length) {
            this.up($currentActive);
          }
        }

        $target.attr('aria-hidden', false).parent('[data-tab-content]').addBack().parent().addClass('is-active');

        $target.slideDown(this.options.slideSpeed, function () {
          /**
           * Fires when the tab is done opening.
           * @event Accordion#down
           */
          _this2.$element.trigger('down.zf.accordion', [$target]);
        });

        $('#' + $target.attr('aria-labelledby')).attr({
          'aria-expanded': true,
          'aria-selected': true
        });
      }

      /**
       * Closes the tab defined by `$target`.
       * @param {jQuery} $target - Accordion tab to close.
       * @fires Accordion#up
       * @function
       */

    }, {
      key: 'up',
      value: function up($target) {
        var $aunts = $target.parent().siblings(),
            _this = this;
        var canClose = this.options.multiExpand ? $aunts.hasClass('is-active') : $target.parent().hasClass('is-active');

        if (!this.options.allowAllClosed && !canClose) {
          return;
        }

        // Foundation.Move(this.options.slideSpeed, $target, function(){
        $target.slideUp(_this.options.slideSpeed, function () {
          /**
           * Fires when the tab is done collapsing up.
           * @event Accordion#up
           */
          _this.$element.trigger('up.zf.accordion', [$target]);
        });
        // });

        $target.attr('aria-hidden', true).parent().removeClass('is-active');

        $('#' + $target.attr('aria-labelledby')).attr({
          'aria-expanded': false,
          'aria-selected': false
        });
      }

      /**
       * Destroys an instance of an accordion.
       * @fires Accordion#destroyed
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.find('[data-tab-content]').slideUp(0).css('display', '');
        this.$element.find('a').off('.zf.accordion');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Accordion;
  }();

  Accordion.defaults = {
    /**
     * Amount of time to animate the opening of an accordion pane.
     * @option
     * @example 250
     */
    slideSpeed: 250,
    /**
     * Allow the accordion to have multiple open panes.
     * @option
     * @example false
     */
    multiExpand: false,
    /**
     * Allow the accordion to close all panes.
     * @option
     * @example false
     */
    allowAllClosed: false
  };

  // Window exports
  Foundation.plugin(Accordion, 'Accordion');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * AccordionMenu module.
   * @module foundation.accordionMenu
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   * @requires foundation.util.nest
   */

  var AccordionMenu = function () {
    /**
     * Creates a new instance of an accordion menu.
     * @class
     * @fires AccordionMenu#init
     * @param {jQuery} element - jQuery object to make into an accordion menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function AccordionMenu(element, options) {
      _classCallCheck(this, AccordionMenu);

      this.$element = element;
      this.options = $.extend({}, AccordionMenu.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'accordion');

      this._init();

      Foundation.registerPlugin(this, 'AccordionMenu');
      Foundation.Keyboard.register('AccordionMenu', {
        'ENTER': 'toggle',
        'SPACE': 'toggle',
        'ARROW_RIGHT': 'open',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'close',
        'ESCAPE': 'closeAll',
        'TAB': 'down',
        'SHIFT_TAB': 'up'
      });
    }

    /**
     * Initializes the accordion menu by hiding all nested menus.
     * @private
     */


    _createClass(AccordionMenu, [{
      key: '_init',
      value: function _init() {
        this.$element.find('[data-submenu]').not('.is-active').slideUp(0); //.find('a').css('padding-left', '1rem');
        this.$element.attr({
          'role': 'tablist',
          'aria-multiselectable': this.options.multiOpen
        });

        this.$menuLinks = this.$element.find('.is-accordion-submenu-parent');
        this.$menuLinks.each(function () {
          var linkId = this.id || Foundation.GetYoDigits(6, 'acc-menu-link'),
              $elem = $(this),
              $sub = $elem.children('[data-submenu]'),
              subId = $sub[0].id || Foundation.GetYoDigits(6, 'acc-menu'),
              isActive = $sub.hasClass('is-active');
          $elem.attr({
            'aria-controls': subId,
            'aria-expanded': isActive,
            'role': 'tab',
            'id': linkId
          });
          $sub.attr({
            'aria-labelledby': linkId,
            'aria-hidden': !isActive,
            'role': 'tabpanel',
            'id': subId
          });
        });
        var initPanes = this.$element.find('.is-active');
        if (initPanes.length) {
          var _this = this;
          initPanes.each(function () {
            _this.down($(this));
          });
        }
        this._events();
      }

      /**
       * Adds event handlers for items within the menu.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        this.$element.find('li').each(function () {
          var $submenu = $(this).children('[data-submenu]');

          if ($submenu.length) {
            $(this).children('a').off('click.zf.accordionMenu').on('click.zf.accordionMenu', function (e) {
              e.preventDefault();

              _this.toggle($submenu);
            });
          }
        }).on('keydown.zf.accordionmenu', function (e) {
          var $element = $(this),
              $elements = $element.parent('ul').children('li'),
              $prevElement,
              $nextElement,
              $target = $element.children('[data-submenu]');

          $elements.each(function (i) {
            if ($(this).is($element)) {
              $prevElement = $elements.eq(Math.max(0, i - 1)).find('a').first();
              $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1)).find('a').first();

              if ($(this).children('[data-submenu]:visible').length) {
                // has open sub menu
                $nextElement = $element.find('li:first-child').find('a').first();
              }
              if ($(this).is(':first-child')) {
                // is first element of sub menu
                $prevElement = $element.parents('li').first().find('a').first();
              } else if ($prevElement.children('[data-submenu]:visible').length) {
                // if previous element has open sub menu
                $prevElement = $prevElement.find('li:last-child').find('a').first();
              }
              if ($(this).is(':last-child')) {
                // is last element of sub menu
                $nextElement = $element.parents('li').first().next('li').find('a').first();
              }

              return;
            }
          });
          Foundation.Keyboard.handleKey(e, 'AccordionMenu', {
            open: function () {
              if ($target.is(':hidden')) {
                _this.down($target);
                $target.find('li').first().find('a').first().focus();
              }
            },
            close: function () {
              if ($target.length && !$target.is(':hidden')) {
                // close active sub of this item
                _this.up($target);
              } else if ($element.parent('[data-submenu]').length) {
                // close currently open sub
                _this.up($element.parent('[data-submenu]'));
                $element.parents('li').first().find('a').first().focus();
              }
            },
            up: function () {
              $prevElement.attr('tabindex', -1).focus();
              e.preventDefault();
            },
            down: function () {
              $nextElement.attr('tabindex', -1).focus();
              e.preventDefault();
            },
            toggle: function () {
              if ($element.children('[data-submenu]').length) {
                _this.toggle($element.children('[data-submenu]'));
              }
            },
            closeAll: function () {
              _this.hideAll();
            },
            handled: function () {
              e.stopImmediatePropagation();
            }
          });
        }); //.attr('tabindex', 0);
      }

      /**
       * Closes all panes of the menu.
       * @function
       */

    }, {
      key: 'hideAll',
      value: function hideAll() {
        this.$element.find('[data-submenu]').slideUp(this.options.slideSpeed);
      }

      /**
       * Toggles the open/close state of a submenu.
       * @function
       * @param {jQuery} $target - the submenu to toggle
       */

    }, {
      key: 'toggle',
      value: function toggle($target) {
        if (!$target.is(':animated')) {
          if (!$target.is(':hidden')) {
            this.up($target);
          } else {
            this.down($target);
          }
        }
      }

      /**
       * Opens the sub-menu defined by `$target`.
       * @param {jQuery} $target - Sub-menu to open.
       * @fires AccordionMenu#down
       */

    }, {
      key: 'down',
      value: function down($target) {
        var _this = this;

        if (!this.options.multiOpen) {
          this.up(this.$element.find('.is-active').not($target.parentsUntil(this.$element).add($target)));
        }

        $target.addClass('is-active').attr({ 'aria-hidden': false }).parent('.is-accordion-submenu-parent').attr({ 'aria-expanded': true });

        Foundation.Move(this.options.slideSpeed, $target, function () {
          $target.slideDown(_this.options.slideSpeed, function () {
            /**
             * Fires when the menu is done opening.
             * @event AccordionMenu#down
             */
            _this.$element.trigger('down.zf.accordionMenu', [$target]);
          });
        });
      }

      /**
       * Closes the sub-menu defined by `$target`. All sub-menus inside the target will be closed as well.
       * @param {jQuery} $target - Sub-menu to close.
       * @fires AccordionMenu#up
       */

    }, {
      key: 'up',
      value: function up($target) {
        var _this = this;
        Foundation.Move(this.options.slideSpeed, $target, function () {
          $target.slideUp(_this.options.slideSpeed, function () {
            /**
             * Fires when the menu is done collapsing up.
             * @event AccordionMenu#up
             */
            _this.$element.trigger('up.zf.accordionMenu', [$target]);
          });
        });

        var $menus = $target.find('[data-submenu]').slideUp(0).addBack().attr('aria-hidden', true);

        $menus.parent('.is-accordion-submenu-parent').attr('aria-expanded', false);
      }

      /**
       * Destroys an instance of accordion menu.
       * @fires AccordionMenu#destroyed
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.find('[data-submenu]').slideDown(0).css('display', '');
        this.$element.find('a').off('click.zf.accordionMenu');

        Foundation.Nest.Burn(this.$element, 'accordion');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return AccordionMenu;
  }();

  AccordionMenu.defaults = {
    /**
     * Amount of time to animate the opening of a submenu in ms.
     * @option
     * @example 250
     */
    slideSpeed: 250,
    /**
     * Allow the menu to have multiple open panes.
     * @option
     * @example true
     */
    multiOpen: true
  };

  // Window exports
  Foundation.plugin(AccordionMenu, 'AccordionMenu');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Drilldown module.
   * @module foundation.drilldown
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   * @requires foundation.util.nest
   */

  var Drilldown = function () {
    /**
     * Creates a new instance of a drilldown menu.
     * @class
     * @param {jQuery} element - jQuery object to make into an accordion menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Drilldown(element, options) {
      _classCallCheck(this, Drilldown);

      this.$element = element;
      this.options = $.extend({}, Drilldown.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'drilldown');

      this._init();

      Foundation.registerPlugin(this, 'Drilldown');
      Foundation.Keyboard.register('Drilldown', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'previous',
        'ESCAPE': 'close',
        'TAB': 'down',
        'SHIFT_TAB': 'up'
      });
    }

    /**
     * Initializes the drilldown by creating jQuery collections of elements
     * @private
     */


    _createClass(Drilldown, [{
      key: '_init',
      value: function _init() {
        this.$submenuAnchors = this.$element.find('li.is-drilldown-submenu-parent').children('a');
        this.$submenus = this.$submenuAnchors.parent('li').children('[data-submenu]');
        this.$menuItems = this.$element.find('li').not('.js-drilldown-back').attr('role', 'menuitem').find('a');

        this._prepareMenu();

        this._keyboardEvents();
      }

      /**
       * prepares drilldown menu by setting attributes to links and elements
       * sets a min height to prevent content jumping
       * wraps the element if not already wrapped
       * @private
       * @function
       */

    }, {
      key: '_prepareMenu',
      value: function _prepareMenu() {
        var _this = this;
        // if(!this.options.holdOpen){
        //   this._menuLinkEvents();
        // }
        this.$submenuAnchors.each(function () {
          var $sub = $(this);
          var $link = $sub.find('a:first');
          if (_this.options.parentLink) {
            $link.clone().prependTo($sub.children('[data-submenu]')).wrap('<li class="is-submenu-parent-item is-submenu-item is-drilldown-submenu-item" role="menu-item"></li>');
          }
          $link.data('savedHref', $link.attr('href')).removeAttr('href');
          $sub.children('[data-submenu]').attr({
            'aria-hidden': true,
            'tabindex': 0,
            'role': 'menu'
          });
          _this._events($sub);
        });
        this.$submenus.each(function () {
          var $menu = $(this),
              $back = $menu.find('.js-drilldown-back');
          if (!$back.length) {
            $menu.prepend(_this.options.backButton);
          }
          _this._back($menu);
        });
        if (!this.$element.parent().hasClass('is-drilldown')) {
          this.$wrapper = $(this.options.wrapper).addClass('is-drilldown').css(this._getMaxDims());
          this.$element.wrap(this.$wrapper);
        }
      }

      /**
       * Adds event handlers to elements in the menu.
       * @function
       * @private
       * @param {jQuery} $elem - the current menu item to add handlers to.
       */

    }, {
      key: '_events',
      value: function _events($elem) {
        var _this = this;

        $elem.off('click.zf.drilldown').on('click.zf.drilldown', function (e) {
          if ($(e.target).parentsUntil('ul', 'li').hasClass('is-drilldown-submenu-parent')) {
            e.stopImmediatePropagation();
            e.preventDefault();
          }

          // if(e.target !== e.currentTarget.firstElementChild){
          //   return false;
          // }
          _this._show($elem.parent('li'));

          if (_this.options.closeOnClick) {
            var $body = $('body').not(_this.$wrapper);
            $body.off('.zf.drilldown').on('click.zf.drilldown', function (e) {
              e.preventDefault();
              _this._hideAll();
              $body.off('.zf.drilldown');
            });
          }
        });
      }

      /**
       * Adds keydown event listener to `li`'s in the menu.
       * @private
       */

    }, {
      key: '_keyboardEvents',
      value: function _keyboardEvents() {
        var _this = this;

        this.$menuItems.add(this.$element.find('.js-drilldown-back > a')).on('keydown.zf.drilldown', function (e) {

          var $element = $(this),
              $elements = $element.parent('li').parent('ul').children('li').children('a'),
              $prevElement,
              $nextElement;

          $elements.each(function (i) {
            if ($(this).is($element)) {
              $prevElement = $elements.eq(Math.max(0, i - 1));
              $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1));
              return;
            }
          });

          Foundation.Keyboard.handleKey(e, 'Drilldown', {
            next: function () {
              if ($element.is(_this.$submenuAnchors)) {
                _this._show($element.parent('li'));
                $element.parent('li').one(Foundation.transitionend($element), function () {
                  $element.parent('li').find('ul li a').filter(_this.$menuItems).first().focus();
                });
                e.preventDefault();
              }
            },
            previous: function () {
              _this._hide($element.parent('li').parent('ul'));
              $element.parent('li').parent('ul').one(Foundation.transitionend($element), function () {
                setTimeout(function () {
                  $element.parent('li').parent('ul').parent('li').children('a').first().focus();
                }, 1);
              });
              e.preventDefault();
            },
            up: function () {
              $prevElement.focus();
              e.preventDefault();
            },
            down: function () {
              $nextElement.focus();
              e.preventDefault();
            },
            close: function () {
              _this._back();
              //_this.$menuItems.first().focus(); // focus to first element
            },
            open: function () {
              if (!$element.is(_this.$menuItems)) {
                // not menu item means back button
                _this._hide($element.parent('li').parent('ul'));
                $element.parent('li').parent('ul').one(Foundation.transitionend($element), function () {
                  setTimeout(function () {
                    $element.parent('li').parent('ul').parent('li').children('a').first().focus();
                  }, 1);
                });
                e.preventDefault();
              } else if ($element.is(_this.$submenuAnchors)) {
                _this._show($element.parent('li'));
                $element.parent('li').one(Foundation.transitionend($element), function () {
                  $element.parent('li').find('ul li a').filter(_this.$menuItems).first().focus();
                });
                e.preventDefault();
              }
            },
            handled: function () {
              e.stopImmediatePropagation();
            }
          });
        }); // end keyboardAccess
      }

      /**
       * Closes all open elements, and returns to root menu.
       * @function
       * @fires Drilldown#closed
       */

    }, {
      key: '_hideAll',
      value: function _hideAll() {
        var $elem = this.$element.find('.is-drilldown-submenu.is-active').addClass('is-closing');
        $elem.one(Foundation.transitionend($elem), function (e) {
          $elem.removeClass('is-active is-closing');
        });
        /**
         * Fires when the menu is fully closed.
         * @event Drilldown#closed
         */
        this.$element.trigger('closed.zf.drilldown');
      }

      /**
       * Adds event listener for each `back` button, and closes open menus.
       * @function
       * @fires Drilldown#back
       * @param {jQuery} $elem - the current sub-menu to add `back` event.
       */

    }, {
      key: '_back',
      value: function _back($elem) {
        var _this = this;
        $elem.off('click.zf.drilldown');
        $elem.children('.js-drilldown-back').on('click.zf.drilldown', function (e) {
          e.stopImmediatePropagation();
          // console.log('mouseup on back');
          _this._hide($elem);
        });
      }

      /**
       * Adds event listener to menu items w/o submenus to close open menus on click.
       * @function
       * @private
       */

    }, {
      key: '_menuLinkEvents',
      value: function _menuLinkEvents() {
        var _this = this;
        this.$menuItems.not('.is-drilldown-submenu-parent').off('click.zf.drilldown').on('click.zf.drilldown', function (e) {
          // e.stopImmediatePropagation();
          setTimeout(function () {
            _this._hideAll();
          }, 0);
        });
      }

      /**
       * Opens a submenu.
       * @function
       * @fires Drilldown#open
       * @param {jQuery} $elem - the current element with a submenu to open, i.e. the `li` tag.
       */

    }, {
      key: '_show',
      value: function _show($elem) {
        $elem.children('[data-submenu]').addClass('is-active');

        this.$element.trigger('open.zf.drilldown', [$elem]);
      }
    }, {
      key: '_hide',


      /**
       * Hides a submenu
       * @function
       * @fires Drilldown#hide
       * @param {jQuery} $elem - the current sub-menu to hide, i.e. the `ul` tag.
       */
      value: function _hide($elem) {
        var _this = this;
        $elem.addClass('is-closing').one(Foundation.transitionend($elem), function () {
          $elem.removeClass('is-active is-closing');
          $elem.blur();
        });
        /**
         * Fires when the submenu is has closed.
         * @event Drilldown#hide
         */
        $elem.trigger('hide.zf.drilldown', [$elem]);
      }

      /**
       * Iterates through the nested menus to calculate the min-height, and max-width for the menu.
       * Prevents content jumping.
       * @function
       * @private
       */

    }, {
      key: '_getMaxDims',
      value: function _getMaxDims() {
        var max = 0,
            result = {};
        this.$submenus.add(this.$element).each(function () {
          var numOfElems = $(this).children('li').length;
          max = numOfElems > max ? numOfElems : max;
        });

        result['min-height'] = max * this.$menuItems[0].getBoundingClientRect().height + 'px';
        result['max-width'] = this.$element[0].getBoundingClientRect().width + 'px';

        return result;
      }

      /**
       * Destroys the Drilldown Menu
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this._hideAll();
        Foundation.Nest.Burn(this.$element, 'drilldown');
        this.$element.unwrap().find('.js-drilldown-back, .is-submenu-parent-item').remove().end().find('.is-active, .is-closing, .is-drilldown-submenu').removeClass('is-active is-closing is-drilldown-submenu').end().find('[data-submenu]').removeAttr('aria-hidden tabindex role').off('.zf.drilldown').end().off('zf.drilldown');
        this.$element.find('a').each(function () {
          var $link = $(this);
          if ($link.data('savedHref')) {
            $link.attr('href', $link.data('savedHref')).removeData('savedHref');
          } else {
            return;
          }
        });
        Foundation.unregisterPlugin(this);
      }
    }]);

    return Drilldown;
  }();

  Drilldown.defaults = {
    /**
     * Markup used for JS generated back button. Prepended to submenu lists and deleted on `destroy` method, 'js-drilldown-back' class required. Remove the backslash (`\`) if copy and pasting.
     * @option
     * @example '<\li><\a>Back<\/a><\/li>'
     */
    backButton: '<li class="js-drilldown-back"><a tabindex="0">Back</a></li>',
    /**
     * Markup used to wrap drilldown menu. Use a class name for independent styling; the JS applied class: `is-drilldown` is required. Remove the backslash (`\`) if copy and pasting.
     * @option
     * @example '<\div class="is-drilldown"><\/div>'
     */
    wrapper: '<div></div>',
    /**
     * Adds the parent link to the submenu.
     * @option
     * @example false
     */
    parentLink: false,
    /**
     * Allow the menu to return to root list on body click.
     * @option
     * @example false
     */
    closeOnClick: false
    // holdOpen: false
  };

  // Window exports
  Foundation.plugin(Drilldown, 'Drilldown');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Dropdown module.
   * @module foundation.dropdown
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.triggers
   */

  var Dropdown = function () {
    /**
     * Creates a new instance of a dropdown.
     * @class
     * @param {jQuery} element - jQuery object to make into a dropdown.
     *        Object should be of the dropdown panel, rather than its anchor.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Dropdown(element, options) {
      _classCallCheck(this, Dropdown);

      this.$element = element;
      this.options = $.extend({}, Dropdown.defaults, this.$element.data(), options);
      this._init();

      Foundation.registerPlugin(this, 'Dropdown');
      Foundation.Keyboard.register('Dropdown', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ESCAPE': 'close',
        'TAB': 'tab_forward',
        'SHIFT_TAB': 'tab_backward'
      });
    }

    /**
     * Initializes the plugin by setting/checking options and attributes, adding helper variables, and saving the anchor.
     * @function
     * @private
     */


    _createClass(Dropdown, [{
      key: '_init',
      value: function _init() {
        var $id = this.$element.attr('id');

        this.$anchor = $('[data-toggle="' + $id + '"]') || $('[data-open="' + $id + '"]');
        this.$anchor.attr({
          'aria-controls': $id,
          'data-is-focus': false,
          'data-yeti-box': $id,
          'aria-haspopup': true,
          'aria-expanded': false

        });

        this.options.positionClass = this.getPositionClass();
        this.counter = 4;
        this.usedPositions = [];
        this.$element.attr({
          'aria-hidden': 'true',
          'data-yeti-box': $id,
          'data-resize': $id,
          'aria-labelledby': this.$anchor[0].id || Foundation.GetYoDigits(6, 'dd-anchor')
        });
        this._events();
      }

      /**
       * Helper function to determine current orientation of dropdown pane.
       * @function
       * @returns {String} position - string value of a position class.
       */

    }, {
      key: 'getPositionClass',
      value: function getPositionClass() {
        var verticalPosition = this.$element[0].className.match(/(top|left|right|bottom)/g);
        verticalPosition = verticalPosition ? verticalPosition[0] : '';
        var horizontalPosition = /float-(.+)\s/.exec(this.$anchor[0].className);
        horizontalPosition = horizontalPosition ? horizontalPosition[1] : '';
        var position = horizontalPosition ? horizontalPosition + ' ' + verticalPosition : verticalPosition;
        return position;
      }

      /**
       * Adjusts the dropdown panes orientation by adding/removing positioning classes.
       * @function
       * @private
       * @param {String} position - position class to remove.
       */

    }, {
      key: '_reposition',
      value: function _reposition(position) {
        this.usedPositions.push(position ? position : 'bottom');
        //default, try switching to opposite side
        if (!position && this.usedPositions.indexOf('top') < 0) {
          this.$element.addClass('top');
        } else if (position === 'top' && this.usedPositions.indexOf('bottom') < 0) {
          this.$element.removeClass(position);
        } else if (position === 'left' && this.usedPositions.indexOf('right') < 0) {
          this.$element.removeClass(position).addClass('right');
        } else if (position === 'right' && this.usedPositions.indexOf('left') < 0) {
          this.$element.removeClass(position).addClass('left');
        }

        //if default change didn't work, try bottom or left first
        else if (!position && this.usedPositions.indexOf('top') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.$element.addClass('left');
          } else if (position === 'top' && this.usedPositions.indexOf('bottom') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.$element.removeClass(position).addClass('left');
          } else if (position === 'left' && this.usedPositions.indexOf('right') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.$element.removeClass(position);
          } else if (position === 'right' && this.usedPositions.indexOf('left') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.$element.removeClass(position);
          }
          //if nothing cleared, set to bottom
          else {
              this.$element.removeClass(position);
            }
        this.classChanged = true;
        this.counter--;
      }

      /**
       * Sets the position and orientation of the dropdown pane, checks for collisions.
       * Recursively calls itself if a collision is detected, with a new position class.
       * @function
       * @private
       */

    }, {
      key: '_setPosition',
      value: function _setPosition() {
        if (this.$anchor.attr('aria-expanded') === 'false') {
          return false;
        }
        var position = this.getPositionClass(),
            $eleDims = Foundation.Box.GetDimensions(this.$element),
            $anchorDims = Foundation.Box.GetDimensions(this.$anchor),
            _this = this,
            direction = position === 'left' ? 'left' : position === 'right' ? 'left' : 'top',
            param = direction === 'top' ? 'height' : 'width',
            offset = param === 'height' ? this.options.vOffset : this.options.hOffset;

        if ($eleDims.width >= $eleDims.windowDims.width || !this.counter && !Foundation.Box.ImNotTouchingYou(this.$element)) {
          this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$anchor, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
            'width': $eleDims.windowDims.width - this.options.hOffset * 2,
            'height': 'auto'
          });
          this.classChanged = true;
          return false;
        }

        this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$anchor, position, this.options.vOffset, this.options.hOffset));

        while (!Foundation.Box.ImNotTouchingYou(this.$element, false, true) && this.counter) {
          this._reposition(position);
          this._setPosition();
        }
      }

      /**
       * Adds event listeners to the element utilizing the triggers utility library.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;
        this.$element.on({
          'open.zf.trigger': this.open.bind(this),
          'close.zf.trigger': this.close.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this),
          'resizeme.zf.trigger': this._setPosition.bind(this)
        });

        if (this.options.hover) {
          this.$anchor.off('mouseenter.zf.dropdown mouseleave.zf.dropdown').on('mouseenter.zf.dropdown', function () {
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function () {
              _this.open();
              _this.$anchor.data('hover', true);
            }, _this.options.hoverDelay);
          }).on('mouseleave.zf.dropdown', function () {
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function () {
              _this.close();
              _this.$anchor.data('hover', false);
            }, _this.options.hoverDelay);
          });
          if (this.options.hoverPane) {
            this.$element.off('mouseenter.zf.dropdown mouseleave.zf.dropdown').on('mouseenter.zf.dropdown', function () {
              clearTimeout(_this.timeout);
            }).on('mouseleave.zf.dropdown', function () {
              clearTimeout(_this.timeout);
              _this.timeout = setTimeout(function () {
                _this.close();
                _this.$anchor.data('hover', false);
              }, _this.options.hoverDelay);
            });
          }
        }
        this.$anchor.add(this.$element).on('keydown.zf.dropdown', function (e) {

          var $target = $(this),
              visibleFocusableElements = Foundation.Keyboard.findFocusable(_this.$element);

          Foundation.Keyboard.handleKey(e, 'Dropdown', {
            tab_forward: function () {
              if (_this.$element.find(':focus').is(visibleFocusableElements.eq(-1))) {
                // left modal downwards, setting focus to first element
                if (_this.options.trapFocus) {
                  // if focus shall be trapped
                  visibleFocusableElements.eq(0).focus();
                  e.preventDefault();
                } else {
                  // if focus is not trapped, close dropdown on focus out
                  _this.close();
                }
              }
            },
            tab_backward: function () {
              if (_this.$element.find(':focus').is(visibleFocusableElements.eq(0)) || _this.$element.is(':focus')) {
                // left modal upwards, setting focus to last element
                if (_this.options.trapFocus) {
                  // if focus shall be trapped
                  visibleFocusableElements.eq(-1).focus();
                  e.preventDefault();
                } else {
                  // if focus is not trapped, close dropdown on focus out
                  _this.close();
                }
              }
            },
            open: function () {
              if ($target.is(_this.$anchor)) {
                _this.open();
                _this.$element.attr('tabindex', -1).focus();
                e.preventDefault();
              }
            },
            close: function () {
              _this.close();
              _this.$anchor.focus();
            }
          });
        });
      }

      /**
       * Adds an event handler to the body to close any dropdowns on a click.
       * @function
       * @private
       */

    }, {
      key: '_addBodyHandler',
      value: function _addBodyHandler() {
        var $body = $(document.body).not(this.$element),
            _this = this;
        $body.off('click.zf.dropdown').on('click.zf.dropdown', function (e) {
          if (_this.$anchor.is(e.target) || _this.$anchor.find(e.target).length) {
            return;
          }
          if (_this.$element.find(e.target).length) {
            return;
          }
          _this.close();
          $body.off('click.zf.dropdown');
        });
      }

      /**
       * Opens the dropdown pane, and fires a bubbling event to close other dropdowns.
       * @function
       * @fires Dropdown#closeme
       * @fires Dropdown#show
       */

    }, {
      key: 'open',
      value: function open() {
        // var _this = this;
        /**
         * Fires to close other open dropdowns
         * @event Dropdown#closeme
         */
        this.$element.trigger('closeme.zf.dropdown', this.$element.attr('id'));
        this.$anchor.addClass('hover').attr({ 'aria-expanded': true });
        // this.$element/*.show()*/;
        this._setPosition();
        this.$element.addClass('is-open').attr({ 'aria-hidden': false });

        if (this.options.autoFocus) {
          var $focusable = Foundation.Keyboard.findFocusable(this.$element);
          if ($focusable.length) {
            $focusable.eq(0).focus();
          }
        }

        if (this.options.closeOnClick) {
          this._addBodyHandler();
        }

        /**
         * Fires once the dropdown is visible.
         * @event Dropdown#show
         */
        this.$element.trigger('show.zf.dropdown', [this.$element]);
      }

      /**
       * Closes the open dropdown pane.
       * @function
       * @fires Dropdown#hide
       */

    }, {
      key: 'close',
      value: function close() {
        if (!this.$element.hasClass('is-open')) {
          return false;
        }
        this.$element.removeClass('is-open').attr({ 'aria-hidden': true });

        this.$anchor.removeClass('hover').attr('aria-expanded', false);

        if (this.classChanged) {
          var curPositionClass = this.getPositionClass();
          if (curPositionClass) {
            this.$element.removeClass(curPositionClass);
          }
          this.$element.addClass(this.options.positionClass)
          /*.hide()*/.css({ height: '', width: '' });
          this.classChanged = false;
          this.counter = 4;
          this.usedPositions.length = 0;
        }
        this.$element.trigger('hide.zf.dropdown', [this.$element]);
      }

      /**
       * Toggles the dropdown pane's visibility.
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.$element.hasClass('is-open')) {
          if (this.$anchor.data('hover')) return;
          this.close();
        } else {
          this.open();
        }
      }

      /**
       * Destroys the dropdown.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.trigger').hide();
        this.$anchor.off('.zf.dropdown');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Dropdown;
  }();

  Dropdown.defaults = {
    /**
     * Amount of time to delay opening a submenu on hover event.
     * @option
     * @example 250
     */
    hoverDelay: 250,
    /**
     * Allow submenus to open on hover events
     * @option
     * @example false
     */
    hover: false,
    /**
     * Don't close dropdown when hovering over dropdown pane
     * @option
     * @example true
     */
    hoverPane: false,
    /**
     * Number of pixels between the dropdown pane and the triggering element on open.
     * @option
     * @example 1
     */
    vOffset: 1,
    /**
     * Number of pixels between the dropdown pane and the triggering element on open.
     * @option
     * @example 1
     */
    hOffset: 1,
    /**
     * Class applied to adjust open position. JS will test and fill this in.
     * @option
     * @example 'top'
     */
    positionClass: '',
    /**
     * Allow the plugin to trap focus to the dropdown pane if opened with keyboard commands.
     * @option
     * @example false
     */
    trapFocus: false,
    /**
     * Allow the plugin to set focus to the first focusable element within the pane, regardless of method of opening.
     * @option
     * @example true
     */
    autoFocus: false,
    /**
     * Allows a click on the body to close the dropdown.
     * @option
     * @example false
     */
    closeOnClick: false
  };

  // Window exports
  Foundation.plugin(Dropdown, 'Dropdown');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * DropdownMenu module.
   * @module foundation.dropdown-menu
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.nest
   */

  var DropdownMenu = function () {
    /**
     * Creates a new instance of DropdownMenu.
     * @class
     * @fires DropdownMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function DropdownMenu(element, options) {
      _classCallCheck(this, DropdownMenu);

      this.$element = element;
      this.options = $.extend({}, DropdownMenu.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'dropdown');
      this._init();

      Foundation.registerPlugin(this, 'DropdownMenu');
      Foundation.Keyboard.register('DropdownMenu', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'previous',
        'ESCAPE': 'close'
      });
    }

    /**
     * Initializes the plugin, and calls _prepareMenu
     * @private
     * @function
     */


    _createClass(DropdownMenu, [{
      key: '_init',
      value: function _init() {
        var subs = this.$element.find('li.is-dropdown-submenu-parent');
        this.$element.children('.is-dropdown-submenu-parent').children('.is-dropdown-submenu').addClass('first-sub');

        this.$menuItems = this.$element.find('[role="menuitem"]');
        this.$tabs = this.$element.children('[role="menuitem"]');
        this.$tabs.find('ul.is-dropdown-submenu').addClass(this.options.verticalClass);

        if (this.$element.hasClass(this.options.rightClass) || this.options.alignment === 'right' || Foundation.rtl() || this.$element.parents('.top-bar-right').is('*')) {
          this.options.alignment = 'right';
          subs.addClass('opens-left');
        } else {
          subs.addClass('opens-right');
        }
        this.changed = false;
        this._events();
      }
    }, {
      key: '_events',

      /**
       * Adds event listeners to elements within the menu
       * @private
       * @function
       */
      value: function _events() {
        var _this = this,
            hasTouch = 'ontouchstart' in window || typeof window.ontouchstart !== 'undefined',
            parClass = 'is-dropdown-submenu-parent';

        if (this.options.clickOpen || hasTouch) {
          this.$menuItems.on('click.zf.dropdownmenu touchstart.zf.dropdownmenu', function (e) {
            var $elem = $(e.target).parentsUntil('ul', '.' + parClass),
                hasSub = $elem.hasClass(parClass),
                hasClicked = $elem.attr('data-is-click') === 'true',
                $sub = $elem.children('.is-dropdown-submenu');

            if (hasSub) {
              if (hasClicked) {
                if (!_this.options.closeOnClick || !_this.options.clickOpen && !hasTouch || _this.options.forceFollow && hasTouch) {
                  return;
                } else {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                  _this._hide($elem);
                }
              } else {
                e.preventDefault();
                e.stopImmediatePropagation();
                _this._show($elem.children('.is-dropdown-submenu'));
                $elem.add($elem.parentsUntil(_this.$element, '.' + parClass)).attr('data-is-click', true);
              }
            } else {
              return;
            }
          });
        }

        if (!this.options.disableHover) {
          this.$menuItems.on('mouseenter.zf.dropdownmenu', function (e) {
            e.stopImmediatePropagation();
            var $elem = $(this),
                hasSub = $elem.hasClass(parClass);

            if (hasSub) {
              clearTimeout(_this.delay);
              _this.delay = setTimeout(function () {
                _this._show($elem.children('.is-dropdown-submenu'));
              }, _this.options.hoverDelay);
            }
          }).on('mouseleave.zf.dropdownmenu', function (e) {
            var $elem = $(this),
                hasSub = $elem.hasClass(parClass);
            if (hasSub && _this.options.autoclose) {
              if ($elem.attr('data-is-click') === 'true' && _this.options.clickOpen) {
                return false;
              }

              clearTimeout(_this.delay);
              _this.delay = setTimeout(function () {
                _this._hide($elem);
              }, _this.options.closingTime);
            }
          });
        }
        this.$menuItems.on('keydown.zf.dropdownmenu', function (e) {
          var $element = $(e.target).parentsUntil('ul', '[role="menuitem"]'),
              isTab = _this.$tabs.index($element) > -1,
              $elements = isTab ? _this.$tabs : $element.siblings('li').add($element),
              $prevElement,
              $nextElement;

          $elements.each(function (i) {
            if ($(this).is($element)) {
              $prevElement = $elements.eq(i - 1);
              $nextElement = $elements.eq(i + 1);
              return;
            }
          });

          var nextSibling = function () {
            if (!$element.is(':last-child')) $nextElement.children('a:first').focus();
          },
              prevSibling = function () {
            $prevElement.children('a:first').focus();
          },
              openSub = function () {
            var $sub = $element.children('ul.is-dropdown-submenu');
            if ($sub.length) {
              _this._show($sub);
              $element.find('li > a:first').focus();
            } else {
              return;
            }
          },
              closeSub = function () {
            //if ($element.is(':first-child')) {
            var close = $element.parent('ul').parent('li');
            close.children('a:first').focus();
            _this._hide(close);
            //}
          };
          var functions = {
            open: openSub,
            close: function () {
              _this._hide(_this.$element);
              _this.$menuItems.find('a:first').focus(); // focus to first element
            },
            handled: function () {
              e.preventDefault();
              e.stopImmediatePropagation();
            }
          };

          if (isTab) {
            if (_this.vertical) {
              // vertical menu
              if (_this.options.alignment === 'left') {
                // left aligned
                $.extend(functions, {
                  down: nextSibling,
                  up: prevSibling,
                  next: openSub,
                  previous: closeSub
                });
              } else {
                // right aligned
                $.extend(functions, {
                  down: nextSibling,
                  up: prevSibling,
                  next: closeSub,
                  previous: openSub
                });
              }
            } else {
              // horizontal menu
              $.extend(functions, {
                next: nextSibling,
                previous: prevSibling,
                down: openSub,
                up: closeSub
              });
            }
          } else {
            // not tabs -> one sub
            if (_this.options.alignment === 'left') {
              // left aligned
              $.extend(functions, {
                next: openSub,
                previous: closeSub,
                down: nextSibling,
                up: prevSibling
              });
            } else {
              // right aligned
              $.extend(functions, {
                next: closeSub,
                previous: openSub,
                down: nextSibling,
                up: prevSibling
              });
            }
          }
          Foundation.Keyboard.handleKey(e, 'DropdownMenu', functions);
        });
      }

      /**
       * Adds an event handler to the body to close any dropdowns on a click.
       * @function
       * @private
       */

    }, {
      key: '_addBodyHandler',
      value: function _addBodyHandler() {
        var $body = $(document.body),
            _this = this;
        $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu').on('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu', function (e) {
          var $link = _this.$element.find(e.target);
          if ($link.length) {
            return;
          }

          _this._hide();
          $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu');
        });
      }

      /**
       * Opens a dropdown pane, and checks for collisions first.
       * @param {jQuery} $sub - ul element that is a submenu to show
       * @function
       * @private
       * @fires DropdownMenu#show
       */

    }, {
      key: '_show',
      value: function _show($sub) {
        var idx = this.$tabs.index(this.$tabs.filter(function (i, el) {
          return $(el).find($sub).length > 0;
        }));
        var $sibs = $sub.parent('li.is-dropdown-submenu-parent').siblings('li.is-dropdown-submenu-parent');
        this._hide($sibs, idx);
        $sub.css('visibility', 'hidden').addClass('js-dropdown-active').attr({ 'aria-hidden': false }).parent('li.is-dropdown-submenu-parent').addClass('is-active').attr({ 'aria-expanded': true });
        var clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
        if (!clear) {
          var oldClass = this.options.alignment === 'left' ? '-right' : '-left',
              $parentLi = $sub.parent('.is-dropdown-submenu-parent');
          $parentLi.removeClass('opens' + oldClass).addClass('opens-' + this.options.alignment);
          clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
          if (!clear) {
            $parentLi.removeClass('opens-' + this.options.alignment).addClass('opens-inner');
          }
          this.changed = true;
        }
        $sub.css('visibility', '');
        if (this.options.closeOnClick) {
          this._addBodyHandler();
        }
        /**
         * Fires when the new dropdown pane is visible.
         * @event DropdownMenu#show
         */
        this.$element.trigger('show.zf.dropdownmenu', [$sub]);
      }

      /**
       * Hides a single, currently open dropdown pane, if passed a parameter, otherwise, hides everything.
       * @function
       * @param {jQuery} $elem - element with a submenu to hide
       * @param {Number} idx - index of the $tabs collection to hide
       * @private
       */

    }, {
      key: '_hide',
      value: function _hide($elem, idx) {
        var $toClose;
        if ($elem && $elem.length) {
          $toClose = $elem;
        } else if (idx !== undefined) {
          $toClose = this.$tabs.not(function (i, el) {
            return i === idx;
          });
        } else {
          $toClose = this.$element;
        }
        var somethingToClose = $toClose.hasClass('is-active') || $toClose.find('.is-active').length > 0;

        if (somethingToClose) {
          $toClose.find('li.is-active').add($toClose).attr({
            'aria-expanded': false,
            'data-is-click': false
          }).removeClass('is-active');

          $toClose.find('ul.js-dropdown-active').attr({
            'aria-hidden': true
          }).removeClass('js-dropdown-active');

          if (this.changed || $toClose.find('opens-inner').length) {
            var oldClass = this.options.alignment === 'left' ? 'right' : 'left';
            $toClose.find('li.is-dropdown-submenu-parent').add($toClose).removeClass('opens-inner opens-' + this.options.alignment).addClass('opens-' + oldClass);
            this.changed = false;
          }
          /**
           * Fires when the open menus are closed.
           * @event DropdownMenu#hide
           */
          this.$element.trigger('hide.zf.dropdownmenu', [$toClose]);
        }
      }

      /**
       * Destroys the plugin.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$menuItems.off('.zf.dropdownmenu').removeAttr('data-is-click').removeClass('is-right-arrow is-left-arrow is-down-arrow opens-right opens-left opens-inner');
        $(document.body).off('.zf.dropdownmenu');
        Foundation.Nest.Burn(this.$element, 'dropdown');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return DropdownMenu;
  }();

  /**
   * Default settings for plugin
   */


  DropdownMenu.defaults = {
    /**
     * Disallows hover events from opening submenus
     * @option
     * @example false
     */
    disableHover: false,
    /**
     * Allow a submenu to automatically close on a mouseleave event, if not clicked open.
     * @option
     * @example true
     */
    autoclose: true,
    /**
     * Amount of time to delay opening a submenu on hover event.
     * @option
     * @example 50
     */
    hoverDelay: 50,
    /**
     * Allow a submenu to open/remain open on parent click event. Allows cursor to move away from menu.
     * @option
     * @example true
     */
    clickOpen: false,
    /**
     * Amount of time to delay closing a submenu on a mouseleave event.
     * @option
     * @example 500
     */

    closingTime: 500,
    /**
     * Position of the menu relative to what direction the submenus should open. Handled by JS.
     * @option
     * @example 'left'
     */
    alignment: 'left',
    /**
     * Allow clicks on the body to close any open submenus.
     * @option
     * @example true
     */
    closeOnClick: true,
    /**
     * Class applied to vertical oriented menus, Foundation default is `vertical`. Update this if using your own class.
     * @option
     * @example 'vertical'
     */
    verticalClass: 'vertical',
    /**
     * Class applied to right-side oriented menus, Foundation default is `align-right`. Update this if using your own class.
     * @option
     * @example 'align-right'
     */
    rightClass: 'align-right',
    /**
     * Boolean to force overide the clicking of links to perform default action, on second touch event for mobile.
     * @option
     * @example false
     */
    forceFollow: true
  };

  // Window exports
  Foundation.plugin(DropdownMenu, 'DropdownMenu');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Equalizer module.
   * @module foundation.equalizer
   */

  var Equalizer = function () {
    /**
     * Creates a new instance of Equalizer.
     * @class
     * @fires Equalizer#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Equalizer(element, options) {
      _classCallCheck(this, Equalizer);

      this.$element = element;
      this.options = $.extend({}, Equalizer.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Equalizer');
    }

    /**
     * Initializes the Equalizer plugin and calls functions to get equalizer functioning on load.
     * @private
     */


    _createClass(Equalizer, [{
      key: '_init',
      value: function _init() {
        var eqId = this.$element.attr('data-equalizer') || '';
        var $watched = this.$element.find('[data-equalizer-watch="' + eqId + '"]');

        this.$watched = $watched.length ? $watched : this.$element.find('[data-equalizer-watch]');
        this.$element.attr('data-resize', eqId || Foundation.GetYoDigits(6, 'eq'));

        this.hasNested = this.$element.find('[data-equalizer]').length > 0;
        this.isNested = this.$element.parentsUntil(document.body, '[data-equalizer]').length > 0;
        this.isOn = false;

        var imgs = this.$element.find('img');
        var tooSmall;
        if (this.options.equalizeOn) {
          tooSmall = this._checkMQ();
          $(window).on('changed.zf.mediaquery', this._checkMQ.bind(this));
        } else {
          this._events();
        }
        if (tooSmall !== undefined && tooSmall === false || tooSmall === undefined) {
          if (imgs.length) {
            Foundation.onImagesLoaded(imgs, this._reflow.bind(this));
          } else {
            this._reflow();
          }
        }
      }

      /**
       * Removes event listeners if the breakpoint is too small.
       * @private
       */

    }, {
      key: '_pauseEvents',
      value: function _pauseEvents() {
        this.isOn = false;
        this.$element.off('.zf.equalizer resizeme.zf.trigger');
      }

      /**
       * Initializes events for Equalizer.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;
        this._pauseEvents();
        if (this.hasNested) {
          this.$element.on('postequalized.zf.equalizer', function (e) {
            if (e.target !== _this.$element[0]) {
              _this._reflow();
            }
          });
        } else {
          this.$element.on('resizeme.zf.trigger', this._reflow.bind(this));
        }
        this.isOn = true;
      }

      /**
       * Checks the current breakpoint to the minimum required size.
       * @private
       */

    }, {
      key: '_checkMQ',
      value: function _checkMQ() {
        var tooSmall = !Foundation.MediaQuery.atLeast(this.options.equalizeOn);
        if (tooSmall) {
          if (this.isOn) {
            this._pauseEvents();
            this.$watched.css('height', 'auto');
          }
        } else {
          if (!this.isOn) {
            this._events();
          }
        }
        return tooSmall;
      }

      /**
       * A noop version for the plugin
       * @private
       */

    }, {
      key: '_killswitch',
      value: function _killswitch() {
        return;
      }

      /**
       * Calls necessary functions to update Equalizer upon DOM change
       * @private
       */

    }, {
      key: '_reflow',
      value: function _reflow() {
        if (!this.options.equalizeOnStack) {
          if (this._isStacked()) {
            this.$watched.css('height', 'auto');
            return false;
          }
        }
        if (this.options.equalizeByRow) {
          this.getHeightsByRow(this.applyHeightByRow.bind(this));
        } else {
          this.getHeights(this.applyHeight.bind(this));
        }
      }

      /**
       * Manually determines if the first 2 elements are *NOT* stacked.
       * @private
       */

    }, {
      key: '_isStacked',
      value: function _isStacked() {
        return this.$watched[0].offsetTop !== this.$watched[1].offsetTop;
      }

      /**
       * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
       * @param {Function} cb - A non-optional callback to return the heights array to.
       * @returns {Array} heights - An array of heights of children within Equalizer container
       */

    }, {
      key: 'getHeights',
      value: function getHeights(cb) {
        var heights = [];
        for (var i = 0, len = this.$watched.length; i < len; i++) {
          this.$watched[i].style.height = 'auto';
          heights.push(this.$watched[i].offsetHeight);
        }
        cb(heights);
      }

      /**
       * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
       * @param {Function} cb - A non-optional callback to return the heights array to.
       * @returns {Array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
       */

    }, {
      key: 'getHeightsByRow',
      value: function getHeightsByRow(cb) {
        var lastElTopOffset = this.$watched.length ? this.$watched.first().offset().top : 0,
            groups = [],
            group = 0;
        //group by Row
        groups[group] = [];
        for (var i = 0, len = this.$watched.length; i < len; i++) {
          this.$watched[i].style.height = 'auto';
          //maybe could use this.$watched[i].offsetTop
          var elOffsetTop = $(this.$watched[i]).offset().top;
          if (elOffsetTop != lastElTopOffset) {
            group++;
            groups[group] = [];
            lastElTopOffset = elOffsetTop;
          }
          groups[group].push([this.$watched[i], this.$watched[i].offsetHeight]);
        }

        for (var j = 0, ln = groups.length; j < ln; j++) {
          var heights = $(groups[j]).map(function () {
            return this[1];
          }).get();
          var max = Math.max.apply(null, heights);
          groups[j].push(max);
        }
        cb(groups);
      }

      /**
       * Changes the CSS height property of each child in an Equalizer parent to match the tallest
       * @param {array} heights - An array of heights of children within Equalizer container
       * @fires Equalizer#preequalized
       * @fires Equalizer#postequalized
       */

    }, {
      key: 'applyHeight',
      value: function applyHeight(heights) {
        var max = Math.max.apply(null, heights);
        /**
         * Fires before the heights are applied
         * @event Equalizer#preequalized
         */
        this.$element.trigger('preequalized.zf.equalizer');

        this.$watched.css('height', max);

        /**
         * Fires when the heights have been applied
         * @event Equalizer#postequalized
         */
        this.$element.trigger('postequalized.zf.equalizer');
      }

      /**
       * Changes the CSS height property of each child in an Equalizer parent to match the tallest by row
       * @param {array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
       * @fires Equalizer#preequalized
       * @fires Equalizer#preequalizedRow
       * @fires Equalizer#postequalizedRow
       * @fires Equalizer#postequalized
       */

    }, {
      key: 'applyHeightByRow',
      value: function applyHeightByRow(groups) {
        /**
         * Fires before the heights are applied
         */
        this.$element.trigger('preequalized.zf.equalizer');
        for (var i = 0, len = groups.length; i < len; i++) {
          var groupsILength = groups[i].length,
              max = groups[i][groupsILength - 1];
          if (groupsILength <= 2) {
            $(groups[i][0][0]).css({ 'height': 'auto' });
            continue;
          }
          /**
            * Fires before the heights per row are applied
            * @event Equalizer#preequalizedRow
            */
          this.$element.trigger('preequalizedrow.zf.equalizer');
          for (var j = 0, lenJ = groupsILength - 1; j < lenJ; j++) {
            $(groups[i][j][0]).css({ 'height': max });
          }
          /**
            * Fires when the heights per row have been applied
            * @event Equalizer#postequalizedRow
            */
          this.$element.trigger('postequalizedrow.zf.equalizer');
        }
        /**
         * Fires when the heights have been applied
         */
        this.$element.trigger('postequalized.zf.equalizer');
      }

      /**
       * Destroys an instance of Equalizer.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this._pauseEvents();
        this.$watched.css('height', 'auto');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Equalizer;
  }();

  /**
   * Default settings for plugin
   */


  Equalizer.defaults = {
    /**
     * Enable height equalization when stacked on smaller screens.
     * @option
     * @example true
     */
    equalizeOnStack: true,
    /**
     * Enable height equalization row by row.
     * @option
     * @example false
     */
    equalizeByRow: false,
    /**
     * String representing the minimum breakpoint size the plugin should equalize heights on.
     * @option
     * @example 'medium'
     */
    equalizeOn: ''
  };

  // Window exports
  Foundation.plugin(Equalizer, 'Equalizer');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Interchange module.
   * @module foundation.interchange
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.timerAndImageLoader
   */

  var Interchange = function () {
    /**
     * Creates a new instance of Interchange.
     * @class
     * @fires Interchange#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Interchange(element, options) {
      _classCallCheck(this, Interchange);

      this.$element = element;
      this.options = $.extend({}, Interchange.defaults, options);
      this.rules = [];
      this.currentPath = '';

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'Interchange');
    }

    /**
     * Initializes the Interchange plugin and calls functions to get interchange functioning on load.
     * @function
     * @private
     */


    _createClass(Interchange, [{
      key: '_init',
      value: function _init() {
        this._addBreakpoints();
        this._generateRules();
        this._reflow();
      }

      /**
       * Initializes events for Interchange.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        $(window).on('resize.zf.interchange', Foundation.util.throttle(this._reflow.bind(this), 50));
      }

      /**
       * Calls necessary functions to update Interchange upon DOM change
       * @function
       * @private
       */

    }, {
      key: '_reflow',
      value: function _reflow() {
        var match;

        // Iterate through each rule, but only save the last match
        for (var i in this.rules) {
          var rule = this.rules[i];

          if (window.matchMedia(rule.query).matches) {
            match = rule;
          }
        }

        if (match) {
          this.replace(match.path);
        }
      }

      /**
       * Gets the Foundation breakpoints and adds them to the Interchange.SPECIAL_QUERIES object.
       * @function
       * @private
       */

    }, {
      key: '_addBreakpoints',
      value: function _addBreakpoints() {
        for (var i in Foundation.MediaQuery.queries) {
          var query = Foundation.MediaQuery.queries[i];
          Interchange.SPECIAL_QUERIES[query.name] = query.value;
        }
      }

      /**
       * Checks the Interchange element for the provided media query + content pairings
       * @function
       * @private
       * @param {Object} element - jQuery object that is an Interchange instance
       * @returns {Array} scenarios - Array of objects that have 'mq' and 'path' keys with corresponding keys
       */

    }, {
      key: '_generateRules',
      value: function _generateRules(element) {
        var rulesList = [];
        var rules;

        if (this.options.rules) {
          rules = this.options.rules;
        } else {
          rules = this.$element.data('interchange').match(/\[.*?\]/g);
        }

        for (var i in rules) {
          var rule = rules[i].slice(1, -1).split(', ');
          var path = rule.slice(0, -1).join('');
          var query = rule[rule.length - 1];

          if (Interchange.SPECIAL_QUERIES[query]) {
            query = Interchange.SPECIAL_QUERIES[query];
          }

          rulesList.push({
            path: path,
            query: query
          });
        }

        this.rules = rulesList;
      }

      /**
       * Update the `src` property of an image, or change the HTML of a container, to the specified path.
       * @function
       * @param {String} path - Path to the image or HTML partial.
       * @fires Interchange#replaced
       */

    }, {
      key: 'replace',
      value: function replace(path) {
        if (this.currentPath === path) return;

        var _this = this,
            trigger = 'replaced.zf.interchange';

        // Replacing images
        if (this.$element[0].nodeName === 'IMG') {
          this.$element.attr('src', path).load(function () {
            _this.currentPath = path;
          }).trigger(trigger);
        }
        // Replacing background images
        else if (path.match(/\.(gif|jpg|jpeg|png|svg|tiff)([?#].*)?/i)) {
            this.$element.css({ 'background-image': 'url(' + path + ')' }).trigger(trigger);
          }
          // Replacing HTML
          else {
              $.get(path, function (response) {
                _this.$element.html(response).trigger(trigger);
                $(response).foundation();
                _this.currentPath = path;
              });
            }

        /**
         * Fires when content in an Interchange element is done being loaded.
         * @event Interchange#replaced
         */
        // this.$element.trigger('replaced.zf.interchange');
      }

      /**
       * Destroys an instance of interchange.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        //TODO this.
      }
    }]);

    return Interchange;
  }();

  /**
   * Default settings for plugin
   */


  Interchange.defaults = {
    /**
     * Rules to be applied to Interchange elements. Set with the `data-interchange` array notation.
     * @option
     */
    rules: null
  };

  Interchange.SPECIAL_QUERIES = {
    'landscape': 'screen and (orientation: landscape)',
    'portrait': 'screen and (orientation: portrait)',
    'retina': 'only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (min--moz-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min-device-pixel-ratio: 2), only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx)'
  };

  // Window exports
  Foundation.plugin(Interchange, 'Interchange');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Magellan module.
   * @module foundation.magellan
   */

  var Magellan = function () {
    /**
     * Creates a new instance of Magellan.
     * @class
     * @fires Magellan#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Magellan(element, options) {
      _classCallCheck(this, Magellan);

      this.$element = element;
      this.options = $.extend({}, Magellan.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Magellan');
    }

    /**
     * Initializes the Magellan plugin and calls functions to get equalizer functioning on load.
     * @private
     */


    _createClass(Magellan, [{
      key: '_init',
      value: function _init() {
        var id = this.$element[0].id || Foundation.GetYoDigits(6, 'magellan');
        var _this = this;
        this.$targets = $('[data-magellan-target]');
        this.$links = this.$element.find('a');
        this.$element.attr({
          'data-resize': id,
          'data-scroll': id,
          'id': id
        });
        this.$active = $();
        this.scrollPos = parseInt(window.pageYOffset, 10);

        this._events();
      }

      /**
       * Calculates an array of pixel values that are the demarcation lines between locations on the page.
       * Can be invoked if new elements are added or the size of a location changes.
       * @function
       */

    }, {
      key: 'calcPoints',
      value: function calcPoints() {
        var _this = this,
            body = document.body,
            html = document.documentElement;

        this.points = [];
        this.winHeight = Math.round(Math.max(window.innerHeight, html.clientHeight));
        this.docHeight = Math.round(Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight));

        this.$targets.each(function () {
          var $tar = $(this),
              pt = Math.round($tar.offset().top - _this.options.threshold);
          $tar.targetPoint = pt;
          _this.points.push(pt);
        });
      }

      /**
       * Initializes events for Magellan.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this,
            $body = $('html, body'),
            opts = {
          duration: _this.options.animationDuration,
          easing: _this.options.animationEasing
        };
        $(window).one('load', function () {
          if (_this.options.deepLinking) {
            if (location.hash) {
              _this.scrollToLoc(location.hash);
            }
          }
          _this.calcPoints();
          _this._updateActive();
        });

        this.$element.on({
          'resizeme.zf.trigger': this.reflow.bind(this),
          'scrollme.zf.trigger': this._updateActive.bind(this)
        }).on('click.zf.magellan', 'a[href^="#"]', function (e) {
          e.preventDefault();
          var arrival = this.getAttribute('href');
          _this.scrollToLoc(arrival);
        });
      }

      /**
       * Function to scroll to a given location on the page.
       * @param {String} loc - a properly formatted jQuery id selector. Example: '#foo'
       * @function
       */

    }, {
      key: 'scrollToLoc',
      value: function scrollToLoc(loc) {
        var scrollPos = Math.round($(loc).offset().top - this.options.threshold / 2 - this.options.barOffset);

        $('html, body').stop(true).animate({ scrollTop: scrollPos }, this.options.animationDuration, this.options.animationEasing);
      }

      /**
       * Calls necessary functions to update Magellan upon DOM change
       * @function
       */

    }, {
      key: 'reflow',
      value: function reflow() {
        this.calcPoints();
        this._updateActive();
      }

      /**
       * Updates the visibility of an active location link, and updates the url hash for the page, if deepLinking enabled.
       * @private
       * @function
       * @fires Magellan#update
       */

    }, {
      key: '_updateActive',
      value: function _updateActive() /*evt, elem, scrollPos*/{
        var winPos = /*scrollPos ||*/parseInt(window.pageYOffset, 10),
            curIdx;

        if (winPos + this.winHeight === this.docHeight) {
          curIdx = this.points.length - 1;
        } else if (winPos < this.points[0]) {
          curIdx = 0;
        } else {
          var isDown = this.scrollPos < winPos,
              _this = this,
              curVisible = this.points.filter(function (p, i) {
            return isDown ? p <= winPos : p - _this.options.threshold <= winPos; //&& winPos >= _this.points[i -1] - _this.options.threshold;
          });
          curIdx = curVisible.length ? curVisible.length - 1 : 0;
        }

        this.$active.removeClass(this.options.activeClass);
        this.$active = this.$links.eq(curIdx).addClass(this.options.activeClass);

        if (this.options.deepLinking) {
          var hash = this.$active[0].getAttribute('href');
          if (window.history.pushState) {
            window.history.pushState(null, null, hash);
          } else {
            window.location.hash = hash;
          }
        }

        this.scrollPos = winPos;
        /**
         * Fires when magellan is finished updating to the new active element.
         * @event Magellan#update
         */
        this.$element.trigger('update.zf.magellan', [this.$active]);
      }

      /**
       * Destroys an instance of Magellan and resets the url of the window.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.trigger .zf.magellan').find('.' + this.options.activeClass).removeClass(this.options.activeClass);

        if (this.options.deepLinking) {
          var hash = this.$active[0].getAttribute('href');
          window.location.hash.replace(hash, '');
        }

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Magellan;
  }();

  /**
   * Default settings for plugin
   */


  Magellan.defaults = {
    /**
     * Amount of time, in ms, the animated scrolling should take between locations.
     * @option
     * @example 500
     */
    animationDuration: 500,
    /**
     * Animation style to use when scrolling between locations.
     * @option
     * @example 'ease-in-out'
     */
    animationEasing: 'linear',
    /**
     * Number of pixels to use as a marker for location changes.
     * @option
     * @example 50
     */
    threshold: 50,
    /**
     * Class applied to the active locations link on the magellan container.
     * @option
     * @example 'active'
     */
    activeClass: 'active',
    /**
     * Allows the script to manipulate the url of the current page, and if supported, alter the history.
     * @option
     * @example true
     */
    deepLinking: false,
    /**
     * Number of pixels to offset the scroll of the page on item click if using a sticky nav bar.
     * @option
     * @example 25
     */
    barOffset: 0
  };

  // Window exports
  Foundation.plugin(Magellan, 'Magellan');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * OffCanvas module.
   * @module foundation.offcanvas
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.triggers
   * @requires foundation.util.motion
   */

  var OffCanvas = function () {
    /**
     * Creates a new instance of an off-canvas wrapper.
     * @class
     * @fires OffCanvas#init
     * @param {Object} element - jQuery object to initialize.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function OffCanvas(element, options) {
      _classCallCheck(this, OffCanvas);

      this.$element = element;
      this.options = $.extend({}, OffCanvas.defaults, this.$element.data(), options);
      this.$lastTrigger = $();

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'OffCanvas');
    }

    /**
     * Initializes the off-canvas wrapper by adding the exit overlay (if needed).
     * @function
     * @private
     */


    _createClass(OffCanvas, [{
      key: '_init',
      value: function _init() {
        var id = this.$element.attr('id');

        this.$element.attr('aria-hidden', 'true');

        // Find triggers that affect this element and add aria-expanded to them
        $(document).find('[data-open="' + id + '"], [data-close="' + id + '"], [data-toggle="' + id + '"]').attr('aria-expanded', 'false').attr('aria-controls', id);

        // Add a close trigger over the body if necessary
        if (this.options.closeOnClick) {
          if ($('.js-off-canvas-exit').length) {
            this.$exiter = $('.js-off-canvas-exit');
          } else {
            var exiter = document.createElement('div');
            exiter.setAttribute('class', 'js-off-canvas-exit');
            $('[data-off-canvas-content]').append(exiter);

            this.$exiter = $(exiter);
          }
        }

        this.options.isRevealed = this.options.isRevealed || new RegExp(this.options.revealClass, 'g').test(this.$element[0].className);

        if (this.options.isRevealed) {
          this.options.revealOn = this.options.revealOn || this.$element[0].className.match(/(reveal-for-medium|reveal-for-large)/g)[0].split('-')[2];
          this._setMQChecker();
        }
        if (!this.options.transitionTime) {
          this.options.transitionTime = parseFloat(window.getComputedStyle($('[data-off-canvas-wrapper]')[0]).transitionDuration) * 1000;
        }
      }

      /**
       * Adds event handlers to the off-canvas wrapper and the exit overlay.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        this.$element.off('.zf.trigger .zf.offcanvas').on({
          'open.zf.trigger': this.open.bind(this),
          'close.zf.trigger': this.close.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this),
          'keydown.zf.offcanvas': this._handleKeyboard.bind(this)
        });

        if (this.options.closeOnClick && this.$exiter.length) {
          this.$exiter.on({ 'click.zf.offcanvas': this.close.bind(this) });
        }
      }

      /**
       * Applies event listener for elements that will reveal at certain breakpoints.
       * @private
       */

    }, {
      key: '_setMQChecker',
      value: function _setMQChecker() {
        var _this = this;

        $(window).on('changed.zf.mediaquery', function () {
          if (Foundation.MediaQuery.atLeast(_this.options.revealOn)) {
            _this.reveal(true);
          } else {
            _this.reveal(false);
          }
        }).one('load.zf.offcanvas', function () {
          if (Foundation.MediaQuery.atLeast(_this.options.revealOn)) {
            _this.reveal(true);
          }
        });
      }

      /**
       * Handles the revealing/hiding the off-canvas at breakpoints, not the same as open.
       * @param {Boolean} isRevealed - true if element should be revealed.
       * @function
       */

    }, {
      key: 'reveal',
      value: function reveal(isRevealed) {
        var $closer = this.$element.find('[data-close]');
        if (isRevealed) {
          this.close();
          this.isRevealed = true;
          // if (!this.options.forceTop) {
          //   var scrollPos = parseInt(window.pageYOffset);
          //   this.$element[0].style.transform = 'translate(0,' + scrollPos + 'px)';
          // }
          // if (this.options.isSticky) { this._stick(); }
          this.$element.off('open.zf.trigger toggle.zf.trigger');
          if ($closer.length) {
            $closer.hide();
          }
        } else {
          this.isRevealed = false;
          // if (this.options.isSticky || !this.options.forceTop) {
          //   this.$element[0].style.transform = '';
          //   $(window).off('scroll.zf.offcanvas');
          // }
          this.$element.on({
            'open.zf.trigger': this.open.bind(this),
            'toggle.zf.trigger': this.toggle.bind(this)
          });
          if ($closer.length) {
            $closer.show();
          }
        }
      }

      /**
       * Opens the off-canvas menu.
       * @function
       * @param {Object} event - Event object passed from listener.
       * @param {jQuery} trigger - element that triggered the off-canvas to open.
       * @fires OffCanvas#opened
       */

    }, {
      key: 'open',
      value: function open(event, trigger) {
        if (this.$element.hasClass('is-open') || this.isRevealed) {
          return;
        }
        var _this = this,
            $body = $(document.body);

        if (this.options.forceTop) {
          $('body').scrollTop(0);
        }
        // window.pageYOffset = 0;

        // if (!this.options.forceTop) {
        //   var scrollPos = parseInt(window.pageYOffset);
        //   this.$element[0].style.transform = 'translate(0,' + scrollPos + 'px)';
        //   if (this.$exiter.length) {
        //     this.$exiter[0].style.transform = 'translate(0,' + scrollPos + 'px)';
        //   }
        // }
        /**
         * Fires when the off-canvas menu opens.
         * @event OffCanvas#opened
         */
        Foundation.Move(this.options.transitionTime, this.$element, function () {
          $('[data-off-canvas-wrapper]').addClass('is-off-canvas-open is-open-' + _this.options.position);

          _this.$element.addClass('is-open');

          // if (_this.options.isSticky) {
          //   _this._stick();
          // }
        });
        this.$element.attr('aria-hidden', 'false').trigger('opened.zf.offcanvas');

        if (this.options.closeOnClick) {
          this.$exiter.addClass('is-visible');
        }

        if (trigger) {
          this.$lastTrigger = trigger.attr('aria-expanded', 'true');
        }

        if (this.options.autoFocus) {
          this.$element.one(Foundation.transitionend(this.$element), function () {
            _this.$element.find('a, button').eq(0).focus();
          });
        }

        if (this.options.trapFocus) {
          $('[data-off-canvas-content]').attr('tabindex', '-1');
          this._trapFocus();
        }
      }

      /**
       * Traps focus within the offcanvas on open.
       * @private
       */

    }, {
      key: '_trapFocus',
      value: function _trapFocus() {
        var focusable = Foundation.Keyboard.findFocusable(this.$element),
            first = focusable.eq(0),
            last = focusable.eq(-1);

        focusable.off('.zf.offcanvas').on('keydown.zf.offcanvas', function (e) {
          if (e.which === 9 || e.keycode === 9) {
            if (e.target === last[0] && !e.shiftKey) {
              e.preventDefault();
              first.focus();
            }
            if (e.target === first[0] && e.shiftKey) {
              e.preventDefault();
              last.focus();
            }
          }
        });
      }

      /**
       * Allows the offcanvas to appear sticky utilizing translate properties.
       * @private
       */
      // OffCanvas.prototype._stick = function() {
      //   var elStyle = this.$element[0].style;
      //
      //   if (this.options.closeOnClick) {
      //     var exitStyle = this.$exiter[0].style;
      //   }
      //
      //   $(window).on('scroll.zf.offcanvas', function(e) {
      //     console.log(e);
      //     var pageY = window.pageYOffset;
      //     elStyle.transform = 'translate(0,' + pageY + 'px)';
      //     if (exitStyle !== undefined) { exitStyle.transform = 'translate(0,' + pageY + 'px)'; }
      //   });
      //   // this.$element.trigger('stuck.zf.offcanvas');
      // };
      /**
       * Closes the off-canvas menu.
       * @function
       * @param {Function} cb - optional cb to fire after closure.
       * @fires OffCanvas#closed
       */

    }, {
      key: 'close',
      value: function close(cb) {
        if (!this.$element.hasClass('is-open') || this.isRevealed) {
          return;
        }

        var _this = this;

        //  Foundation.Move(this.options.transitionTime, this.$element, function() {
        $('[data-off-canvas-wrapper]').removeClass('is-off-canvas-open is-open-' + _this.options.position);
        _this.$element.removeClass('is-open');
        // Foundation._reflow();
        // });
        this.$element.attr('aria-hidden', 'true')
        /**
         * Fires when the off-canvas menu opens.
         * @event OffCanvas#closed
         */
        .trigger('closed.zf.offcanvas');
        // if (_this.options.isSticky || !_this.options.forceTop) {
        //   setTimeout(function() {
        //     _this.$element[0].style.transform = '';
        //     $(window).off('scroll.zf.offcanvas');
        //   }, this.options.transitionTime);
        // }
        if (this.options.closeOnClick) {
          this.$exiter.removeClass('is-visible');
        }

        this.$lastTrigger.attr('aria-expanded', 'false');
        if (this.options.trapFocus) {
          $('[data-off-canvas-content]').removeAttr('tabindex');
        }
      }

      /**
       * Toggles the off-canvas menu open or closed.
       * @function
       * @param {Object} event - Event object passed from listener.
       * @param {jQuery} trigger - element that triggered the off-canvas to open.
       */

    }, {
      key: 'toggle',
      value: function toggle(event, trigger) {
        if (this.$element.hasClass('is-open')) {
          this.close(event, trigger);
        } else {
          this.open(event, trigger);
        }
      }

      /**
       * Handles keyboard input when detected. When the escape key is pressed, the off-canvas menu closes, and focus is restored to the element that opened the menu.
       * @function
       * @private
       */

    }, {
      key: '_handleKeyboard',
      value: function _handleKeyboard(event) {
        if (event.which !== 27) return;

        event.stopPropagation();
        event.preventDefault();
        this.close();
        this.$lastTrigger.focus();
      }

      /**
       * Destroys the offcanvas plugin.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.close();
        this.$element.off('.zf.trigger .zf.offcanvas');
        this.$exiter.off('.zf.offcanvas');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return OffCanvas;
  }();

  OffCanvas.defaults = {
    /**
     * Allow the user to click outside of the menu to close it.
     * @option
     * @example true
     */
    closeOnClick: true,

    /**
     * Amount of time in ms the open and close transition requires. If none selected, pulls from body style.
     * @option
     * @example 500
     */
    transitionTime: 0,

    /**
     * Direction the offcanvas opens from. Determines class applied to body.
     * @option
     * @example left
     */
    position: 'left',

    /**
     * Force the page to scroll to top on open.
     * @option
     * @example true
     */
    forceTop: true,

    /**
     * Allow the offcanvas to remain open for certain breakpoints.
     * @option
     * @example false
     */
    isRevealed: false,

    /**
     * Breakpoint at which to reveal. JS will use a RegExp to target standard classes, if changing classnames, pass your class with the `revealClass` option.
     * @option
     * @example reveal-for-large
     */
    revealOn: null,

    /**
     * Force focus to the offcanvas on open. If true, will focus the opening trigger on close.
     * @option
     * @example true
     */
    autoFocus: true,

    /**
     * Class used to force an offcanvas to remain open. Foundation defaults for this are `reveal-for-large` & `reveal-for-medium`.
     * @option
     * TODO improve the regex testing for this.
     * @example reveal-for-large
     */
    revealClass: 'reveal-for-',

    /**
     * Triggers optional focus trapping when opening an offcanvas. Sets tabindex of [data-off-canvas-content] to -1 for accessibility purposes.
     * @option
     * @example true
     */
    trapFocus: false
  };

  // Window exports
  Foundation.plugin(OffCanvas, 'OffCanvas');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Orbit module.
   * @module foundation.orbit
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   * @requires foundation.util.timerAndImageLoader
   * @requires foundation.util.touch
   */

  var Orbit = function () {
    /**
    * Creates a new instance of an orbit carousel.
    * @class
    * @param {jQuery} element - jQuery object to make into an Orbit Carousel.
    * @param {Object} options - Overrides to the default plugin settings.
    */

    function Orbit(element, options) {
      _classCallCheck(this, Orbit);

      this.$element = element;
      this.options = $.extend({}, Orbit.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Orbit');
      Foundation.Keyboard.register('Orbit', {
        'ltr': {
          'ARROW_RIGHT': 'next',
          'ARROW_LEFT': 'previous'
        },
        'rtl': {
          'ARROW_LEFT': 'next',
          'ARROW_RIGHT': 'previous'
        }
      });
    }

    /**
    * Initializes the plugin by creating jQuery collections, setting attributes, and starting the animation.
    * @function
    * @private
    */


    _createClass(Orbit, [{
      key: '_init',
      value: function _init() {
        this.$wrapper = this.$element.find('.' + this.options.containerClass);
        this.$slides = this.$element.find('.' + this.options.slideClass);
        var $images = this.$element.find('img'),
            initActive = this.$slides.filter('.is-active');

        if (!initActive.length) {
          this.$slides.eq(0).addClass('is-active');
        }

        if (!this.options.useMUI) {
          this.$slides.addClass('no-motionui');
        }

        if ($images.length) {
          Foundation.onImagesLoaded($images, this._prepareForOrbit.bind(this));
        } else {
          this._prepareForOrbit(); //hehe
        }

        if (this.options.bullets) {
          this._loadBullets();
        }

        this._events();

        if (this.options.autoPlay && this.$slides.length > 1) {
          this.geoSync();
        }

        if (this.options.accessible) {
          // allow wrapper to be focusable to enable arrow navigation
          this.$wrapper.attr('tabindex', 0);
        }
      }

      /**
      * Creates a jQuery collection of bullets, if they are being used.
      * @function
      * @private
      */

    }, {
      key: '_loadBullets',
      value: function _loadBullets() {
        this.$bullets = this.$element.find('.' + this.options.boxOfBullets).find('button');
      }

      /**
      * Sets a `timer` object on the orbit, and starts the counter for the next slide.
      * @function
      */

    }, {
      key: 'geoSync',
      value: function geoSync() {
        var _this = this;
        this.timer = new Foundation.Timer(this.$element, {
          duration: this.options.timerDelay,
          infinite: false
        }, function () {
          _this.changeSlide(true);
        });
        this.timer.start();
      }

      /**
      * Sets wrapper and slide heights for the orbit.
      * @function
      * @private
      */

    }, {
      key: '_prepareForOrbit',
      value: function _prepareForOrbit() {
        var _this = this;
        this._setWrapperHeight(function (max) {
          _this._setSlideHeight(max);
        });
      }

      /**
      * Calulates the height of each slide in the collection, and uses the tallest one for the wrapper height.
      * @function
      * @private
      * @param {Function} cb - a callback function to fire when complete.
      */

    }, {
      key: '_setWrapperHeight',
      value: function _setWrapperHeight(cb) {
        //rewrite this to `for` loop
        var max = 0,
            temp,
            counter = 0;

        this.$slides.each(function () {
          temp = this.getBoundingClientRect().height;
          $(this).attr('data-slide', counter);

          if (counter) {
            //if not the first slide, set css position and display property
            $(this).css({ 'position': 'relative', 'display': 'none' });
          }
          max = temp > max ? temp : max;
          counter++;
        });

        if (counter === this.$slides.length) {
          this.$wrapper.css({ 'height': max }); //only change the wrapper height property once.
          cb(max); //fire callback with max height dimension.
        }
      }

      /**
      * Sets the max-height of each slide.
      * @function
      * @private
      */

    }, {
      key: '_setSlideHeight',
      value: function _setSlideHeight(height) {
        this.$slides.each(function () {
          $(this).css('max-height', height);
        });
      }

      /**
      * Adds event listeners to basically everything within the element.
      * @function
      * @private
      */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        //***************************************
        //**Now using custom event - thanks to:**
        //**      Yohai Ararat of Toronto      **
        //***************************************
        if (this.$slides.length > 1) {

          if (this.options.swipe) {
            this.$slides.off('swipeleft.zf.orbit swiperight.zf.orbit').on('swipeleft.zf.orbit', function (e) {
              e.preventDefault();
              _this.changeSlide(true);
            }).on('swiperight.zf.orbit', function (e) {
              e.preventDefault();
              _this.changeSlide(false);
            });
          }
          //***************************************

          if (this.options.autoPlay) {
            this.$slides.on('click.zf.orbit', function () {
              _this.$element.data('clickedOn', _this.$element.data('clickedOn') ? false : true);
              _this.timer[_this.$element.data('clickedOn') ? 'pause' : 'start']();
            });

            if (this.options.pauseOnHover) {
              this.$element.on('mouseenter.zf.orbit', function () {
                _this.timer.pause();
              }).on('mouseleave.zf.orbit', function () {
                if (!_this.$element.data('clickedOn')) {
                  _this.timer.start();
                }
              });
            }
          }

          if (this.options.navButtons) {
            var $controls = this.$element.find('.' + this.options.nextClass + ', .' + this.options.prevClass);
            $controls.attr('tabindex', 0)
            //also need to handle enter/return and spacebar key presses
            .on('click.zf.orbit touchend.zf.orbit', function (e) {
              e.preventDefault();
              _this.changeSlide($(this).hasClass(_this.options.nextClass));
            });
          }

          if (this.options.bullets) {
            this.$bullets.on('click.zf.orbit touchend.zf.orbit', function () {
              if (/is-active/g.test(this.className)) {
                return false;
              } //if this is active, kick out of function.
              var idx = $(this).data('slide'),
                  ltr = idx > _this.$slides.filter('.is-active').data('slide'),
                  $slide = _this.$slides.eq(idx);

              _this.changeSlide(ltr, $slide, idx);
            });
          }

          this.$wrapper.add(this.$bullets).on('keydown.zf.orbit', function (e) {
            // handle keyboard event with keyboard util
            Foundation.Keyboard.handleKey(e, 'Orbit', {
              next: function () {
                _this.changeSlide(true);
              },
              previous: function () {
                _this.changeSlide(false);
              },
              handled: function () {
                // if bullet is focused, make sure focus moves
                if ($(e.target).is(_this.$bullets)) {
                  _this.$bullets.filter('.is-active').focus();
                }
              }
            });
          });
        }
      }

      /**
      * Changes the current slide to a new one.
      * @function
      * @param {Boolean} isLTR - flag if the slide should move left to right.
      * @param {jQuery} chosenSlide - the jQuery element of the slide to show next, if one is selected.
      * @param {Number} idx - the index of the new slide in its collection, if one chosen.
      * @fires Orbit#slidechange
      */

    }, {
      key: 'changeSlide',
      value: function changeSlide(isLTR, chosenSlide, idx) {
        var $curSlide = this.$slides.filter('.is-active').eq(0);

        if (/mui/g.test($curSlide[0].className)) {
          return false;
        } //if the slide is currently animating, kick out of the function

        var $firstSlide = this.$slides.first(),
            $lastSlide = this.$slides.last(),
            dirIn = isLTR ? 'Right' : 'Left',
            dirOut = isLTR ? 'Left' : 'Right',
            _this = this,
            $newSlide;

        if (!chosenSlide) {
          //most of the time, this will be auto played or clicked from the navButtons.
          $newSlide = isLTR ? //if wrapping enabled, check to see if there is a `next` or `prev` sibling, if not, select the first or last slide to fill in. if wrapping not enabled, attempt to select `next` or `prev`, if there's nothing there, the function will kick out on next step. CRAZY NESTED TERNARIES!!!!!
          this.options.infiniteWrap ? $curSlide.next('.' + this.options.slideClass).length ? $curSlide.next('.' + this.options.slideClass) : $firstSlide : $curSlide.next('.' + this.options.slideClass) : //pick next slide if moving left to right
          this.options.infiniteWrap ? $curSlide.prev('.' + this.options.slideClass).length ? $curSlide.prev('.' + this.options.slideClass) : $lastSlide : $curSlide.prev('.' + this.options.slideClass); //pick prev slide if moving right to left
        } else {
            $newSlide = chosenSlide;
          }

        if ($newSlide.length) {
          if (this.options.bullets) {
            idx = idx || this.$slides.index($newSlide); //grab index to update bullets
            this._updateBullets(idx);
          }

          if (this.options.useMUI) {
            Foundation.Motion.animateIn($newSlide.addClass('is-active').css({ 'position': 'absolute', 'top': 0 }), this.options['animInFrom' + dirIn], function () {
              $newSlide.css({ 'position': 'relative', 'display': 'block' }).attr('aria-live', 'polite');
            });

            Foundation.Motion.animateOut($curSlide.removeClass('is-active'), this.options['animOutTo' + dirOut], function () {
              $curSlide.removeAttr('aria-live');
              if (_this.options.autoPlay && !_this.timer.isPaused) {
                _this.timer.restart();
              }
              //do stuff?
            });
          } else {
              $curSlide.removeClass('is-active is-in').removeAttr('aria-live').hide();
              $newSlide.addClass('is-active is-in').attr('aria-live', 'polite').show();
              if (this.options.autoPlay && !this.timer.isPaused) {
                this.timer.restart();
              }
            }
          /**
          * Triggers when the slide has finished animating in.
          * @event Orbit#slidechange
          */
          this.$element.trigger('slidechange.zf.orbit', [$newSlide]);
        }
      }

      /**
      * Updates the active state of the bullets, if displayed.
      * @function
      * @private
      * @param {Number} idx - the index of the current slide.
      */

    }, {
      key: '_updateBullets',
      value: function _updateBullets(idx) {
        var $oldBullet = this.$element.find('.' + this.options.boxOfBullets).find('.is-active').removeClass('is-active').blur(),
            span = $oldBullet.find('span:last').detach(),
            $newBullet = this.$bullets.eq(idx).addClass('is-active').append(span);
      }

      /**
      * Destroys the carousel and hides the element.
      * @function
      */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.orbit').find('*').off('.zf.orbit').end().hide();
        Foundation.unregisterPlugin(this);
      }
    }]);

    return Orbit;
  }();

  Orbit.defaults = {
    /**
    * Tells the JS to look for and loadBullets.
    * @option
    * @example true
    */
    bullets: true,
    /**
    * Tells the JS to apply event listeners to nav buttons
    * @option
    * @example true
    */
    navButtons: true,
    /**
    * motion-ui animation class to apply
    * @option
    * @example 'slide-in-right'
    */
    animInFromRight: 'slide-in-right',
    /**
    * motion-ui animation class to apply
    * @option
    * @example 'slide-out-right'
    */
    animOutToRight: 'slide-out-right',
    /**
    * motion-ui animation class to apply
    * @option
    * @example 'slide-in-left'
    *
    */
    animInFromLeft: 'slide-in-left',
    /**
    * motion-ui animation class to apply
    * @option
    * @example 'slide-out-left'
    */
    animOutToLeft: 'slide-out-left',
    /**
    * Allows Orbit to automatically animate on page load.
    * @option
    * @example true
    */
    autoPlay: true,
    /**
    * Amount of time, in ms, between slide transitions
    * @option
    * @example 5000
    */
    timerDelay: 5000,
    /**
    * Allows Orbit to infinitely loop through the slides
    * @option
    * @example true
    */
    infiniteWrap: true,
    /**
    * Allows the Orbit slides to bind to swipe events for mobile, requires an additional util library
    * @option
    * @example true
    */
    swipe: true,
    /**
    * Allows the timing function to pause animation on hover.
    * @option
    * @example true
    */
    pauseOnHover: true,
    /**
    * Allows Orbit to bind keyboard events to the slider, to animate frames with arrow keys
    * @option
    * @example true
    */
    accessible: true,
    /**
    * Class applied to the container of Orbit
    * @option
    * @example 'orbit-container'
    */
    containerClass: 'orbit-container',
    /**
    * Class applied to individual slides.
    * @option
    * @example 'orbit-slide'
    */
    slideClass: 'orbit-slide',
    /**
    * Class applied to the bullet container. You're welcome.
    * @option
    * @example 'orbit-bullets'
    */
    boxOfBullets: 'orbit-bullets',
    /**
    * Class applied to the `next` navigation button.
    * @option
    * @example 'orbit-next'
    */
    nextClass: 'orbit-next',
    /**
    * Class applied to the `previous` navigation button.
    * @option
    * @example 'orbit-previous'
    */
    prevClass: 'orbit-previous',
    /**
    * Boolean to flag the js to use motion ui classes or not. Default to true for backwards compatability.
    * @option
    * @example true
    */
    useMUI: true
  };

  // Window exports
  Foundation.plugin(Orbit, 'Orbit');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * ResponsiveMenu module.
   * @module foundation.responsiveMenu
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.accordionMenu
   * @requires foundation.util.drilldown
   * @requires foundation.util.dropdown-menu
   */

  var ResponsiveMenu = function () {
    /**
     * Creates a new instance of a responsive menu.
     * @class
     * @fires ResponsiveMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function ResponsiveMenu(element, options) {
      _classCallCheck(this, ResponsiveMenu);

      this.$element = $(element);
      this.rules = this.$element.data('responsive-menu');
      this.currentMq = null;
      this.currentPlugin = null;

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveMenu');
    }

    /**
     * Initializes the Menu by parsing the classes from the 'data-ResponsiveMenu' attribute on the element.
     * @function
     * @private
     */


    _createClass(ResponsiveMenu, [{
      key: '_init',
      value: function _init() {
        // The first time an Interchange plugin is initialized, this.rules is converted from a string of "classes" to an object of rules
        if (typeof this.rules === 'string') {
          var rulesTree = {};

          // Parse rules from "classes" pulled from data attribute
          var rules = this.rules.split(' ');

          // Iterate through every rule found
          for (var i = 0; i < rules.length; i++) {
            var rule = rules[i].split('-');
            var ruleSize = rule.length > 1 ? rule[0] : 'small';
            var rulePlugin = rule.length > 1 ? rule[1] : rule[0];

            if (MenuPlugins[rulePlugin] !== null) {
              rulesTree[ruleSize] = MenuPlugins[rulePlugin];
            }
          }

          this.rules = rulesTree;
        }

        if (!$.isEmptyObject(this.rules)) {
          this._checkMediaQueries();
        }
      }

      /**
       * Initializes events for the Menu.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        $(window).on('changed.zf.mediaquery', function () {
          _this._checkMediaQueries();
        });
        // $(window).on('resize.zf.ResponsiveMenu', function() {
        //   _this._checkMediaQueries();
        // });
      }

      /**
       * Checks the current screen width against available media queries. If the media query has changed, and the plugin needed has changed, the plugins will swap out.
       * @function
       * @private
       */

    }, {
      key: '_checkMediaQueries',
      value: function _checkMediaQueries() {
        var matchedMq,
            _this = this;
        // Iterate through each rule and find the last matching rule
        $.each(this.rules, function (key) {
          if (Foundation.MediaQuery.atLeast(key)) {
            matchedMq = key;
          }
        });

        // No match? No dice
        if (!matchedMq) return;

        // Plugin already initialized? We good
        if (this.currentPlugin instanceof this.rules[matchedMq].plugin) return;

        // Remove existing plugin-specific CSS classes
        $.each(MenuPlugins, function (key, value) {
          _this.$element.removeClass(value.cssClass);
        });

        // Add the CSS class for the new plugin
        this.$element.addClass(this.rules[matchedMq].cssClass);

        // Create an instance of the new plugin
        if (this.currentPlugin) this.currentPlugin.destroy();
        this.currentPlugin = new this.rules[matchedMq].plugin(this.$element, {});
      }

      /**
       * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.currentPlugin.destroy();
        $(window).off('.zf.ResponsiveMenu');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return ResponsiveMenu;
  }();

  ResponsiveMenu.defaults = {};

  // The plugin matches the plugin classes with these plugin instances.
  var MenuPlugins = {
    dropdown: {
      cssClass: 'dropdown',
      plugin: Foundation._plugins['dropdown-menu'] || null
    },
    drilldown: {
      cssClass: 'drilldown',
      plugin: Foundation._plugins['drilldown'] || null
    },
    accordion: {
      cssClass: 'accordion-menu',
      plugin: Foundation._plugins['accordion-menu'] || null
    }
  };

  // Window exports
  Foundation.plugin(ResponsiveMenu, 'ResponsiveMenu');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * ResponsiveToggle module.
   * @module foundation.responsiveToggle
   * @requires foundation.util.mediaQuery
   */

  var ResponsiveToggle = function () {
    /**
     * Creates a new instance of Tab Bar.
     * @class
     * @fires ResponsiveToggle#init
     * @param {jQuery} element - jQuery object to attach tab bar functionality to.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function ResponsiveToggle(element, options) {
      _classCallCheck(this, ResponsiveToggle);

      this.$element = $(element);
      this.options = $.extend({}, ResponsiveToggle.defaults, this.$element.data(), options);

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveToggle');
    }

    /**
     * Initializes the tab bar by finding the target element, toggling element, and running update().
     * @function
     * @private
     */


    _createClass(ResponsiveToggle, [{
      key: '_init',
      value: function _init() {
        var targetID = this.$element.data('responsive-toggle');
        if (!targetID) {
          console.error('Your tab bar needs an ID of a Menu as the value of data-tab-bar.');
        }

        this.$targetMenu = $('#' + targetID);
        this.$toggler = this.$element.find('[data-toggle]');

        this._update();
      }

      /**
       * Adds necessary event handlers for the tab bar to work.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        $(window).on('changed.zf.mediaquery', this._update.bind(this));

        this.$toggler.on('click.zf.responsiveToggle', this.toggleMenu.bind(this));
      }

      /**
       * Checks the current media query to determine if the tab bar should be visible or hidden.
       * @function
       * @private
       */

    }, {
      key: '_update',
      value: function _update() {
        // Mobile
        if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
          this.$element.show();
          this.$targetMenu.hide();
        }

        // Desktop
        else {
            this.$element.hide();
            this.$targetMenu.show();
          }
      }

      /**
       * Toggles the element attached to the tab bar. The toggle only happens if the screen is small enough to allow it.
       * @function
       * @fires ResponsiveToggle#toggled
       */

    }, {
      key: 'toggleMenu',
      value: function toggleMenu() {
        if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
          this.$targetMenu.toggle(0);

          /**
           * Fires when the element attached to the tab bar toggles.
           * @event ResponsiveToggle#toggled
           */
          this.$element.trigger('toggled.zf.responsiveToggle');
        }
      }
    }, {
      key: 'destroy',
      value: function destroy() {
        //TODO this...
      }
    }]);

    return ResponsiveToggle;
  }();

  ResponsiveToggle.defaults = {
    /**
     * The breakpoint after which the menu is always shown, and the tab bar is hidden.
     * @option
     * @example 'medium'
     */
    hideFor: 'medium'
  };

  // Window exports
  Foundation.plugin(ResponsiveToggle, 'ResponsiveToggle');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Reveal module.
   * @module foundation.reveal
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.motion if using animations
   */

  var Reveal = function () {
    /**
     * Creates a new instance of Reveal.
     * @class
     * @param {jQuery} element - jQuery object to use for the modal.
     * @param {Object} options - optional parameters.
     */

    function Reveal(element, options) {
      _classCallCheck(this, Reveal);

      this.$element = element;
      this.options = $.extend({}, Reveal.defaults, this.$element.data(), options);
      this._init();

      Foundation.registerPlugin(this, 'Reveal');
      Foundation.Keyboard.register('Reveal', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ESCAPE': 'close',
        'TAB': 'tab_forward',
        'SHIFT_TAB': 'tab_backward'
      });
    }

    /**
     * Initializes the modal by adding the overlay and close buttons, (if selected).
     * @private
     */


    _createClass(Reveal, [{
      key: '_init',
      value: function _init() {
        this.id = this.$element.attr('id');
        this.isActive = false;
        this.cached = { mq: Foundation.MediaQuery.current };
        this.isiOS = iPhoneSniff();

        if (this.isiOS) {
          this.$element.addClass('is-ios');
        }

        this.$anchor = $('[data-open="' + this.id + '"]').length ? $('[data-open="' + this.id + '"]') : $('[data-toggle="' + this.id + '"]');

        if (this.$anchor.length) {
          var anchorId = this.$anchor[0].id || Foundation.GetYoDigits(6, 'reveal');

          this.$anchor.attr({
            'aria-controls': this.id,
            'id': anchorId,
            'aria-haspopup': true,
            'tabindex': 0
          });
          this.$element.attr({ 'aria-labelledby': anchorId });
        }

        if (this.options.fullScreen || this.$element.hasClass('full')) {
          this.options.fullScreen = true;
          this.options.overlay = false;
        }
        if (this.options.overlay && !this.$overlay) {
          this.$overlay = this._makeOverlay(this.id);
        }

        this.$element.attr({
          'role': 'dialog',
          'aria-hidden': true,
          'data-yeti-box': this.id,
          'data-resize': this.id
        });

        if (this.$overlay) {
          this.$element.detach().appendTo(this.$overlay);
        } else {
          this.$element.detach().appendTo($('body'));
          this.$element.addClass('without-overlay');
        }
        this._events();
        if (this.options.deepLink && window.location.hash === '#' + this.id) {
          $(window).one('load.zf.reveal', this.open.bind(this));
        }
      }

      /**
       * Creates an overlay div to display behind the modal.
       * @private
       */

    }, {
      key: '_makeOverlay',
      value: function _makeOverlay(id) {
        var $overlay = $('<div></div>').addClass('reveal-overlay').attr({ 'tabindex': -1, 'aria-hidden': true }).appendTo('body');
        return $overlay;
      }

      /**
       * Updates position of modal
       * TODO:  Figure out if we actually need to cache these values or if it doesn't matter
       * @private
       */

    }, {
      key: '_updatePosition',
      value: function _updatePosition() {
        var width = this.$element.outerWidth();
        var outerWidth = $(window).width();
        var height = this.$element.outerHeight();
        var outerHeight = $(window).height();
        var left, top;
        if (this.options.hOffset === 'auto') {
          left = parseInt((outerWidth - width) / 2, 10);
        } else {
          left = parseInt(this.options.hOffset, 10);
        }
        if (this.options.vOffset === 'auto') {
          if (height > outerHeight) {
            top = parseInt(Math.min(100, outerHeight / 10), 10);
          } else {
            top = parseInt((outerHeight - height) / 4, 10);
          }
        } else {
          top = parseInt(this.options.vOffset, 10);
        }
        this.$element.css({ top: top + 'px' });
        // only worry about left if we don't have an overlay or we havea  horizontal offset,
        // otherwise we're perfectly in the middle
        if (!this.$overlay || this.options.hOffset !== 'auto') {
          this.$element.css({ left: left + 'px' });
          this.$element.css({ margin: '0px' });
        }
      }

      /**
       * Adds event handlers for the modal.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;

        this.$element.on({
          'open.zf.trigger': this.open.bind(this),
          'close.zf.trigger': this.close.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this),
          'resizeme.zf.trigger': function () {
            _this._updatePosition();
          }
        });

        if (this.$anchor.length) {
          this.$anchor.on('keydown.zf.reveal', function (e) {
            if (e.which === 13 || e.which === 32) {
              e.stopPropagation();
              e.preventDefault();
              _this.open();
            }
          });
        }

        if (this.options.closeOnClick && this.options.overlay) {
          this.$overlay.off('.zf.reveal').on('click.zf.reveal', function (e) {
            if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target)) {
              return;
            }
            _this.close();
          });
        }
        if (this.options.deepLink) {
          $(window).on('popstate.zf.reveal:' + this.id, this._handleState.bind(this));
        }
      }

      /**
       * Handles modal methods on back/forward button clicks or any other event that triggers popstate.
       * @private
       */

    }, {
      key: '_handleState',
      value: function _handleState(e) {
        if (window.location.hash === '#' + this.id && !this.isActive) {
          this.open();
        } else {
          this.close();
        }
      }

      /**
       * Opens the modal controlled by `this.$anchor`, and closes all others by default.
       * @function
       * @fires Reveal#closeme
       * @fires Reveal#open
       */

    }, {
      key: 'open',
      value: function open() {
        var _this2 = this;

        if (this.options.deepLink) {
          var hash = '#' + this.id;

          if (window.history.pushState) {
            window.history.pushState(null, null, hash);
          } else {
            window.location.hash = hash;
          }
        }

        this.isActive = true;

        // Make elements invisible, but remove display: none so we can get size and positioning
        this.$element.css({ 'visibility': 'hidden' }).show().scrollTop(0);
        if (this.options.overlay) {
          this.$overlay.css({ 'visibility': 'hidden' }).show();
        }

        this._updatePosition();

        this.$element.hide().css({ 'visibility': '' });

        if (this.$overlay) {
          this.$overlay.css({ 'visibility': '' }).hide();
        }

        if (!this.options.multipleOpened) {
          /**
           * Fires immediately before the modal opens.
           * Closes any other modals that are currently open
           * @event Reveal#closeme
           */
          this.$element.trigger('closeme.zf.reveal', this.id);
        }

        // Motion UI method of reveal
        if (this.options.animationIn) {
          if (this.options.overlay) {
            Foundation.Motion.animateIn(this.$overlay, 'fade-in');
          }
          Foundation.Motion.animateIn(this.$element, this.options.animationIn, function () {
            _this2.focusableElements = Foundation.Keyboard.findFocusable(_this2.$element);
          });
        }
        // jQuery method of reveal
        else {
            if (this.options.overlay) {
              this.$overlay.show(0);
            }
            this.$element.show(this.options.showDelay);
          }

        // handle accessibility
        this.$element.attr({
          'aria-hidden': false,
          'tabindex': -1
        }).focus();

        /**
         * Fires when the modal has successfully opened.
         * @event Reveal#open
         */
        this.$element.trigger('open.zf.reveal');

        if (this.isiOS) {
          var scrollPos = window.pageYOffset;
          $('html, body').addClass('is-reveal-open').scrollTop(scrollPos);
        } else {
          $('body').addClass('is-reveal-open');
        }

        $('body').addClass('is-reveal-open').attr('aria-hidden', this.options.overlay || this.options.fullScreen ? true : false);

        setTimeout(function () {
          _this2._extraHandlers();
        }, 0);
      }

      /**
       * Adds extra event handlers for the body and window if necessary.
       * @private
       */

    }, {
      key: '_extraHandlers',
      value: function _extraHandlers() {
        var _this = this;
        this.focusableElements = Foundation.Keyboard.findFocusable(this.$element);

        if (!this.options.overlay && this.options.closeOnClick && !this.options.fullScreen) {
          $('body').on('click.zf.reveal', function (e) {
            if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target)) {
              return;
            }
            _this.close();
          });
        }

        if (this.options.closeOnEsc) {
          $(window).on('keydown.zf.reveal', function (e) {
            Foundation.Keyboard.handleKey(e, 'Reveal', {
              close: function () {
                if (_this.options.closeOnEsc) {
                  _this.close();
                  _this.$anchor.focus();
                }
              }
            });
          });
        }

        // lock focus within modal while tabbing
        this.$element.on('keydown.zf.reveal', function (e) {
          var $target = $(this);
          // handle keyboard event with keyboard util
          Foundation.Keyboard.handleKey(e, 'Reveal', {
            tab_forward: function () {
              if (_this.$element.find(':focus').is(_this.focusableElements.eq(-1))) {
                // left modal downwards, setting focus to first element
                _this.focusableElements.eq(0).focus();
                e.preventDefault();
              }
              if (_this.focusableElements.length === 0) {
                // no focusable elements inside the modal at all, prevent tabbing in general
                e.preventDefault();
              }
            },
            tab_backward: function () {
              if (_this.$element.find(':focus').is(_this.focusableElements.eq(0)) || _this.$element.is(':focus')) {
                // left modal upwards, setting focus to last element
                _this.focusableElements.eq(-1).focus();
                e.preventDefault();
              }
              if (_this.focusableElements.length === 0) {
                // no focusable elements inside the modal at all, prevent tabbing in general
                e.preventDefault();
              }
            },
            open: function () {
              if (_this.$element.find(':focus').is(_this.$element.find('[data-close]'))) {
                setTimeout(function () {
                  // set focus back to anchor if close button has been activated
                  _this.$anchor.focus();
                }, 1);
              } else if ($target.is(_this.focusableElements)) {
                // dont't trigger if acual element has focus (i.e. inputs, links, ...)
                _this.open();
              }
            },
            close: function () {
              if (_this.options.closeOnEsc) {
                _this.close();
                _this.$anchor.focus();
              }
            }
          });
        });
      }

      /**
       * Closes the modal.
       * @function
       * @fires Reveal#closed
       */

    }, {
      key: 'close',
      value: function close() {
        if (!this.isActive || !this.$element.is(':visible')) {
          return false;
        }
        var _this = this;

        // Motion UI method of hiding
        if (this.options.animationOut) {
          if (this.options.overlay) {
            Foundation.Motion.animateOut(this.$overlay, 'fade-out', finishUp);
          } else {
            finishUp();
          }

          Foundation.Motion.animateOut(this.$element, this.options.animationOut);
        }
        // jQuery method of hiding
        else {
            if (this.options.overlay) {
              this.$overlay.hide(0, finishUp);
            } else {
              finishUp();
            }

            this.$element.hide(this.options.hideDelay);
          }

        // Conditionals to remove extra event listeners added on open
        if (this.options.closeOnEsc) {
          $(window).off('keydown.zf.reveal');
        }

        if (!this.options.overlay && this.options.closeOnClick) {
          $('body').off('click.zf.reveal');
        }

        this.$element.off('keydown.zf.reveal');

        function finishUp() {
          if (_this.isiOS) {
            $('html, body').removeClass('is-reveal-open');
          } else {
            $('body').removeClass('is-reveal-open');
          }

          $('body').attr({
            'aria-hidden': false,
            'tabindex': ''
          });

          _this.$element.attr('aria-hidden', true);

          /**
          * Fires when the modal is done closing.
          * @event Reveal#closed
          */
          _this.$element.trigger('closed.zf.reveal');
        }

        /**
        * Resets the modal content
        * This prevents a running video to keep going in the background
        */
        if (this.options.resetOnClose) {
          this.$element.html(this.$element.html());
        }

        this.isActive = false;
        if (_this.options.deepLink) {
          if (window.history.replaceState) {
            window.history.replaceState("", document.title, window.location.pathname);
          } else {
            window.location.hash = '';
          }
        }
      }

      /**
       * Toggles the open/closed state of a modal.
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.isActive) {
          this.close();
        } else {
          this.open();
        }
      }
    }, {
      key: 'destroy',


      /**
       * Destroys an instance of a modal.
       * @function
       */
      value: function destroy() {
        if (this.options.overlay) {
          this.$element.appendTo($('body')); // move $element outside of $overlay to prevent error unregisterPlugin()
          this.$overlay.hide().off().remove();
        }
        this.$element.hide().off();
        this.$anchor.off('.zf');
        $(window).off('.zf.reveal:' + this.id);

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Reveal;
  }();

  Reveal.defaults = {
    /**
     * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
     * @option
     * @example 'slide-in-left'
     */
    animationIn: '',
    /**
     * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
     * @option
     * @example 'slide-out-right'
     */
    animationOut: '',
    /**
     * Time, in ms, to delay the opening of a modal after a click if no animation used.
     * @option
     * @example 10
     */
    showDelay: 0,
    /**
     * Time, in ms, to delay the closing of a modal after a click if no animation used.
     * @option
     * @example 10
     */
    hideDelay: 0,
    /**
     * Allows a click on the body/overlay to close the modal.
     * @option
     * @example true
     */
    closeOnClick: true,
    /**
     * Allows the modal to close if the user presses the `ESCAPE` key.
     * @option
     * @example true
     */
    closeOnEsc: true,
    /**
     * If true, allows multiple modals to be displayed at once.
     * @option
     * @example false
     */
    multipleOpened: false,
    /**
     * Distance, in pixels, the modal should push down from the top of the screen.
     * @option
     * @example auto
     */
    vOffset: 'auto',
    /**
     * Distance, in pixels, the modal should push in from the side of the screen.
     * @option
     * @example auto
     */
    hOffset: 'auto',
    /**
     * Allows the modal to be fullscreen, completely blocking out the rest of the view. JS checks for this as well.
     * @option
     * @example false
     */
    fullScreen: false,
    /**
     * Percentage of screen height the modal should push up from the bottom of the view.
     * @option
     * @example 10
     */
    btmOffsetPct: 10,
    /**
     * Allows the modal to generate an overlay div, which will cover the view when modal opens.
     * @option
     * @example true
     */
    overlay: true,
    /**
     * Allows the modal to remove and reinject markup on close. Should be true if using video elements w/o using provider's api, otherwise, videos will continue to play in the background.
     * @option
     * @example false
     */
    resetOnClose: false,
    /**
     * Allows the modal to alter the url on open/close, and allows the use of the `back` button to close modals. ALSO, allows a modal to auto-maniacally open on page load IF the hash === the modal's user-set id.
     * @option
     * @example false
     */
    deepLink: false
  };

  // Window exports
  Foundation.plugin(Reveal, 'Reveal');

  function iPhoneSniff() {
    return (/iP(ad|hone|od).*OS/.test(window.navigator.userAgent)
    );
  }
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Slider module.
   * @module foundation.slider
   * @requires foundation.util.motion
   * @requires foundation.util.triggers
   * @requires foundation.util.keyboard
   * @requires foundation.util.touch
   */

  var Slider = function () {
    /**
     * Creates a new instance of a drilldown menu.
     * @class
     * @param {jQuery} element - jQuery object to make into an accordion menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Slider(element, options) {
      _classCallCheck(this, Slider);

      this.$element = element;
      this.options = $.extend({}, Slider.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Slider');
      Foundation.Keyboard.register('Slider', {
        'ltr': {
          'ARROW_RIGHT': 'increase',
          'ARROW_UP': 'increase',
          'ARROW_DOWN': 'decrease',
          'ARROW_LEFT': 'decrease',
          'SHIFT_ARROW_RIGHT': 'increase_fast',
          'SHIFT_ARROW_UP': 'increase_fast',
          'SHIFT_ARROW_DOWN': 'decrease_fast',
          'SHIFT_ARROW_LEFT': 'decrease_fast'
        },
        'rtl': {
          'ARROW_LEFT': 'increase',
          'ARROW_RIGHT': 'decrease',
          'SHIFT_ARROW_LEFT': 'increase_fast',
          'SHIFT_ARROW_RIGHT': 'decrease_fast'
        }
      });
    }

    /**
     * Initilizes the plugin by reading/setting attributes, creating collections and setting the initial position of the handle(s).
     * @function
     * @private
     */


    _createClass(Slider, [{
      key: '_init',
      value: function _init() {
        this.inputs = this.$element.find('input');
        this.handles = this.$element.find('[data-slider-handle]');

        this.$handle = this.handles.eq(0);
        this.$input = this.inputs.length ? this.inputs.eq(0) : $('#' + this.$handle.attr('aria-controls'));
        this.$fill = this.$element.find('[data-slider-fill]').css(this.options.vertical ? 'height' : 'width', 0);

        var isDbl = false,
            _this = this;
        if (this.options.disabled || this.$element.hasClass(this.options.disabledClass)) {
          this.options.disabled = true;
          this.$element.addClass(this.options.disabledClass);
        }
        if (!this.inputs.length) {
          this.inputs = $().add(this.$input);
          this.options.binding = true;
        }
        this._setInitAttr(0);
        this._events(this.$handle);

        if (this.handles[1]) {
          this.options.doubleSided = true;
          this.$handle2 = this.handles.eq(1);
          this.$input2 = this.inputs.length > 1 ? this.inputs.eq(1) : $('#' + this.$handle2.attr('aria-controls'));

          if (!this.inputs[1]) {
            this.inputs = this.inputs.add(this.$input2);
          }
          isDbl = true;

          this._setHandlePos(this.$handle, this.options.initialStart, true, function () {

            _this._setHandlePos(_this.$handle2, _this.options.initialEnd, true);
          });
          // this.$handle.triggerHandler('click.zf.slider');
          this._setInitAttr(1);
          this._events(this.$handle2);
        }

        if (!isDbl) {
          this._setHandlePos(this.$handle, this.options.initialStart, true);
        }
      }

      /**
       * Sets the position of the selected handle and fill bar.
       * @function
       * @private
       * @param {jQuery} $hndl - the selected handle to move.
       * @param {Number} location - floating point between the start and end values of the slider bar.
       * @param {Function} cb - callback function to fire on completion.
       * @fires Slider#moved
       * @fires Slider#changed
       */

    }, {
      key: '_setHandlePos',
      value: function _setHandlePos($hndl, location, noInvert, cb) {
        //might need to alter that slightly for bars that will have odd number selections.
        location = parseFloat(location); //on input change events, convert string to number...grumble.

        // prevent slider from running out of bounds, if value exceeds the limits set through options, override the value to min/max
        if (location < this.options.start) {
          location = this.options.start;
        } else if (location > this.options.end) {
          location = this.options.end;
        }

        var isDbl = this.options.doubleSided;

        if (isDbl) {
          //this block is to prevent 2 handles from crossing eachother. Could/should be improved.
          if (this.handles.index($hndl) === 0) {
            var h2Val = parseFloat(this.$handle2.attr('aria-valuenow'));
            location = location >= h2Val ? h2Val - this.options.step : location;
          } else {
            var h1Val = parseFloat(this.$handle.attr('aria-valuenow'));
            location = location <= h1Val ? h1Val + this.options.step : location;
          }
        }

        //this is for single-handled vertical sliders, it adjusts the value to account for the slider being "upside-down"
        //for click and drag events, it's weird due to the scale(-1, 1) css property
        if (this.options.vertical && !noInvert) {
          location = this.options.end - location;
        }

        var _this = this,
            vert = this.options.vertical,
            hOrW = vert ? 'height' : 'width',
            lOrT = vert ? 'top' : 'left',
            handleDim = $hndl[0].getBoundingClientRect()[hOrW],
            elemDim = this.$element[0].getBoundingClientRect()[hOrW],

        //percentage of bar min/max value based on click or drag point
        pctOfBar = percent(location - this.options.start, this.options.end - this.options.start).toFixed(2),

        //number of actual pixels to shift the handle, based on the percentage obtained above
        pxToMove = (elemDim - handleDim) * pctOfBar,

        //percentage of bar to shift the handle
        movement = (percent(pxToMove, elemDim) * 100).toFixed(this.options.decimal);
        //fixing the decimal value for the location number, is passed to other methods as a fixed floating-point value
        location = parseFloat(location.toFixed(this.options.decimal));
        // declare empty object for css adjustments, only used with 2 handled-sliders
        var css = {};

        this._setValues($hndl, location);

        // TODO update to calculate based on values set to respective inputs??
        if (isDbl) {
          var isLeftHndl = this.handles.index($hndl) === 0,

          //empty variable, will be used for min-height/width for fill bar
          dim,

          //percentage w/h of the handle compared to the slider bar
          handlePct = ~ ~(percent(handleDim, elemDim) * 100);
          //if left handle, the math is slightly different than if it's the right handle, and the left/top property needs to be changed for the fill bar
          if (isLeftHndl) {
            //left or top percentage value to apply to the fill bar.
            css[lOrT] = movement + '%';
            //calculate the new min-height/width for the fill bar.
            dim = parseFloat(this.$handle2[0].style[lOrT]) - movement + handlePct;
            //this callback is necessary to prevent errors and allow the proper placement and initialization of a 2-handled slider
            //plus, it means we don't care if 'dim' isNaN on init, it won't be in the future.
            if (cb && typeof cb === 'function') {
              cb();
            } //this is only needed for the initialization of 2 handled sliders
          } else {
              //just caching the value of the left/bottom handle's left/top property
              var handlePos = parseFloat(this.$handle[0].style[lOrT]);
              //calculate the new min-height/width for the fill bar. Use isNaN to prevent false positives for numbers <= 0
              //based on the percentage of movement of the handle being manipulated, less the opposing handle's left/top position, plus the percentage w/h of the handle itself
              dim = movement - (isNaN(handlePos) ? this.options.initialStart / ((this.options.end - this.options.start) / 100) : handlePos) + handlePct;
            }
          // assign the min-height/width to our css object
          css['min-' + hOrW] = dim + '%';
        }

        this.$element.one('finished.zf.animate', function () {
          /**
           * Fires when the handle is done moving.
           * @event Slider#moved
           */
          _this.$element.trigger('moved.zf.slider', [$hndl]);
        });

        //because we don't know exactly how the handle will be moved, check the amount of time it should take to move.
        var moveTime = this.$element.data('dragging') ? 1000 / 60 : this.options.moveTime;

        Foundation.Move(moveTime, $hndl, function () {
          //adjusting the left/top property of the handle, based on the percentage calculated above
          $hndl.css(lOrT, movement + '%');

          if (!_this.options.doubleSided) {
            //if single-handled, a simple method to expand the fill bar
            _this.$fill.css(hOrW, pctOfBar * 100 + '%');
          } else {
            //otherwise, use the css object we created above
            _this.$fill.css(css);
          }
        });

        /**
         * Fires when the value has not been change for a given time.
         * @event Slider#changed
         */
        clearTimeout(_this.timeout);
        _this.timeout = setTimeout(function () {
          _this.$element.trigger('changed.zf.slider', [$hndl]);
        }, _this.options.changedDelay);
      }

      /**
       * Sets the initial attribute for the slider element.
       * @function
       * @private
       * @param {Number} idx - index of the current handle/input to use.
       */

    }, {
      key: '_setInitAttr',
      value: function _setInitAttr(idx) {
        var id = this.inputs.eq(idx).attr('id') || Foundation.GetYoDigits(6, 'slider');
        this.inputs.eq(idx).attr({
          'id': id,
          'max': this.options.end,
          'min': this.options.start,
          'step': this.options.step
        });
        this.handles.eq(idx).attr({
          'role': 'slider',
          'aria-controls': id,
          'aria-valuemax': this.options.end,
          'aria-valuemin': this.options.start,
          'aria-valuenow': idx === 0 ? this.options.initialStart : this.options.initialEnd,
          'aria-orientation': this.options.vertical ? 'vertical' : 'horizontal',
          'tabindex': 0
        });
      }

      /**
       * Sets the input and `aria-valuenow` values for the slider element.
       * @function
       * @private
       * @param {jQuery} $handle - the currently selected handle.
       * @param {Number} val - floating point of the new value.
       */

    }, {
      key: '_setValues',
      value: function _setValues($handle, val) {
        var idx = this.options.doubleSided ? this.handles.index($handle) : 0;
        this.inputs.eq(idx).val(val);
        $handle.attr('aria-valuenow', val);
      }

      /**
       * Handles events on the slider element.
       * Calculates the new location of the current handle.
       * If there are two handles and the bar was clicked, it determines which handle to move.
       * @function
       * @private
       * @param {Object} e - the `event` object passed from the listener.
       * @param {jQuery} $handle - the current handle to calculate for, if selected.
       * @param {Number} val - floating point number for the new value of the slider.
       * TODO clean this up, there's a lot of repeated code between this and the _setHandlePos fn.
       */

    }, {
      key: '_handleEvent',
      value: function _handleEvent(e, $handle, val) {
        var value, hasVal;
        if (!val) {
          //click or drag events
          e.preventDefault();
          var _this = this,
              vertical = this.options.vertical,
              param = vertical ? 'height' : 'width',
              direction = vertical ? 'top' : 'left',
              pageXY = vertical ? e.pageY : e.pageX,
              halfOfHandle = this.$handle[0].getBoundingClientRect()[param] / 2,
              barDim = this.$element[0].getBoundingClientRect()[param],
              barOffset = this.$element.offset()[direction] - pageXY,

          //if the cursor position is less than or greater than the elements bounding coordinates, set coordinates within those bounds
          barXY = barOffset > 0 ? -halfOfHandle : barOffset - halfOfHandle < -barDim ? barDim : Math.abs(barOffset),
              offsetPct = percent(barXY, barDim);
          value = (this.options.end - this.options.start) * offsetPct + this.options.start;

          // turn everything around for RTL, yay math!
          if (Foundation.rtl() && !this.options.vertical) {
            value = this.options.end - value;
          }

          value = _this._adjustValue(null, value);
          //boolean flag for the setHandlePos fn, specifically for vertical sliders
          hasVal = false;

          if (!$handle) {
            //figure out which handle it is, pass it to the next function.
            var firstHndlPos = absPosition(this.$handle, direction, barXY, param),
                secndHndlPos = absPosition(this.$handle2, direction, barXY, param);
            $handle = firstHndlPos <= secndHndlPos ? this.$handle : this.$handle2;
          }
        } else {
          //change event on input
          value = this._adjustValue(null, val);
          hasVal = true;
        }

        this._setHandlePos($handle, value, hasVal);
      }

      /**
       * Adjustes value for handle in regard to step value. returns adjusted value
       * @function
       * @private
       * @param {jQuery} $handle - the selected handle.
       * @param {Number} value - value to adjust. used if $handle is falsy
       */

    }, {
      key: '_adjustValue',
      value: function _adjustValue($handle, value) {
        var val,
            step = this.options.step,
            div = parseFloat(step / 2),
            left,
            prev_val,
            next_val;
        if (!!$handle) {
          val = parseFloat($handle.attr('aria-valuenow'));
        } else {
          val = value;
        }
        left = val % step;
        prev_val = val - left;
        next_val = prev_val + step;
        if (left === 0) {
          return val;
        }
        val = val >= prev_val + div ? next_val : prev_val;
        return val;
      }

      /**
       * Adds event listeners to the slider elements.
       * @function
       * @private
       * @param {jQuery} $handle - the current handle to apply listeners to.
       */

    }, {
      key: '_events',
      value: function _events($handle) {
        if (this.options.disabled) {
          return false;
        }

        var _this = this,
            curHandle,
            timer;

        this.inputs.off('change.zf.slider').on('change.zf.slider', function (e) {
          var idx = _this.inputs.index($(this));
          _this._handleEvent(e, _this.handles.eq(idx), $(this).val());
        });

        if (this.options.clickSelect) {
          this.$element.off('click.zf.slider').on('click.zf.slider', function (e) {
            if (_this.$element.data('dragging')) {
              return false;
            }

            if (!$(e.target).is('[data-slider-handle]')) {
              if (_this.options.doubleSided) {
                _this._handleEvent(e);
              } else {
                _this._handleEvent(e, _this.$handle);
              }
            }
          });
        }

        if (this.options.draggable) {
          this.handles.addTouch();

          var $body = $('body');
          $handle.off('mousedown.zf.slider').on('mousedown.zf.slider', function (e) {
            $handle.addClass('is-dragging');
            _this.$fill.addClass('is-dragging'); //
            _this.$element.data('dragging', true);

            curHandle = $(e.currentTarget);

            $body.on('mousemove.zf.slider', function (e) {
              e.preventDefault();

              _this._handleEvent(e, curHandle);
            }).on('mouseup.zf.slider', function (e) {
              _this._handleEvent(e, curHandle);

              $handle.removeClass('is-dragging');
              _this.$fill.removeClass('is-dragging');
              _this.$element.data('dragging', false);

              $body.off('mousemove.zf.slider mouseup.zf.slider');
            });
          });
        }

        $handle.off('keydown.zf.slider').on('keydown.zf.slider', function (e) {
          var _$handle = $(this),
              idx = _this.options.doubleSided ? _this.handles.index(_$handle) : 0,
              oldValue = parseFloat(_this.inputs.eq(idx).val()),
              newValue;

          // handle keyboard event with keyboard util
          Foundation.Keyboard.handleKey(e, 'Slider', {
            decrease: function () {
              newValue = oldValue - _this.options.step;
            },
            increase: function () {
              newValue = oldValue + _this.options.step;
            },
            decrease_fast: function () {
              newValue = oldValue - _this.options.step * 10;
            },
            increase_fast: function () {
              newValue = oldValue + _this.options.step * 10;
            },
            handled: function () {
              // only set handle pos when event was handled specially
              e.preventDefault();
              _this._setHandlePos(_$handle, newValue, true);
            }
          });
          /*if (newValue) { // if pressed key has special function, update value
            e.preventDefault();
            _this._setHandlePos(_$handle, newValue);
          }*/
        });
      }

      /**
       * Destroys the slider plugin.
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.handles.off('.zf.slider');
        this.inputs.off('.zf.slider');
        this.$element.off('.zf.slider');

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Slider;
  }();

  Slider.defaults = {
    /**
     * Minimum value for the slider scale.
     * @option
     * @example 0
     */
    start: 0,
    /**
     * Maximum value for the slider scale.
     * @option
     * @example 100
     */
    end: 100,
    /**
     * Minimum value change per change event.
     * @option
     * @example 1
     */
    step: 1,
    /**
     * Value at which the handle/input *(left handle/first input)* should be set to on initialization.
     * @option
     * @example 0
     */
    initialStart: 0,
    /**
     * Value at which the right handle/second input should be set to on initialization.
     * @option
     * @example 100
     */
    initialEnd: 100,
    /**
     * Allows the input to be located outside the container and visible. Set to by the JS
     * @option
     * @example false
     */
    binding: false,
    /**
     * Allows the user to click/tap on the slider bar to select a value.
     * @option
     * @example true
     */
    clickSelect: true,
    /**
     * Set to true and use the `vertical` class to change alignment to vertical.
     * @option
     * @example false
     */
    vertical: false,
    /**
     * Allows the user to drag the slider handle(s) to select a value.
     * @option
     * @example true
     */
    draggable: true,
    /**
     * Disables the slider and prevents event listeners from being applied. Double checked by JS with `disabledClass`.
     * @option
     * @example false
     */
    disabled: false,
    /**
     * Allows the use of two handles. Double checked by the JS. Changes some logic handling.
     * @option
     * @example false
     */
    doubleSided: false,
    /**
     * Potential future feature.
     */
    // steps: 100,
    /**
     * Number of decimal places the plugin should go to for floating point precision.
     * @option
     * @example 2
     */
    decimal: 2,
    /**
     * Time delay for dragged elements.
     */
    // dragDelay: 0,
    /**
     * Time, in ms, to animate the movement of a slider handle if user clicks/taps on the bar. Needs to be manually set if updating the transition time in the Sass settings.
     * @option
     * @example 200
     */
    moveTime: 200, //update this if changing the transition time in the sass
    /**
     * Class applied to disabled sliders.
     * @option
     * @example 'disabled'
     */
    disabledClass: 'disabled',
    /**
     * Will invert the default layout for a vertical<span data-tooltip title="who would do this???"> </span>slider.
     * @option
     * @example false
     */
    invertVertical: false,
    /**
     * Milliseconds before the `changed.zf-slider` event is triggered after value change. 
     * @option
     * @example 500
     */
    changedDelay: 500
  };

  function percent(frac, num) {
    return frac / num;
  }
  function absPosition($handle, dir, clickPos, param) {
    return Math.abs($handle.position()[dir] + $handle[param]() / 2 - clickPos);
  }

  // Window exports
  Foundation.plugin(Slider, 'Slider');
}(jQuery);

//*********this is in case we go to static, absolute positions instead of dynamic positioning********
// this.setSteps(function() {
//   _this._events();
//   var initStart = _this.options.positions[_this.options.initialStart - 1] || null;
//   var initEnd = _this.options.initialEnd ? _this.options.position[_this.options.initialEnd - 1] : null;
//   if (initStart || initEnd) {
//     _this._handleEvent(initStart, initEnd);
//   }
// });

//***********the other part of absolute positions*************
// Slider.prototype.setSteps = function(cb) {
//   var posChange = this.$element.outerWidth() / this.options.steps;
//   var counter = 0
//   while(counter < this.options.steps) {
//     if (counter) {
//       this.options.positions.push(this.options.positions[counter - 1] + posChange);
//     } else {
//       this.options.positions.push(posChange);
//     }
//     counter++;
//   }
//   cb();
// };
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Sticky module.
   * @module foundation.sticky
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   */

  var Sticky = function () {
    /**
     * Creates a new instance of a sticky thing.
     * @class
     * @param {jQuery} element - jQuery object to make sticky.
     * @param {Object} options - options object passed when creating the element programmatically.
     */

    function Sticky(element, options) {
      _classCallCheck(this, Sticky);

      this.$element = element;
      this.options = $.extend({}, Sticky.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Sticky');
    }

    /**
     * Initializes the sticky element by adding classes, getting/setting dimensions, breakpoints and attributes
     * @function
     * @private
     */


    _createClass(Sticky, [{
      key: '_init',
      value: function _init() {
        var $parent = this.$element.parent('[data-sticky-container]'),
            id = this.$element[0].id || Foundation.GetYoDigits(6, 'sticky'),
            _this = this;

        if (!$parent.length) {
          this.wasWrapped = true;
        }
        this.$container = $parent.length ? $parent : $(this.options.container).wrapInner(this.$element);
        this.$container.addClass(this.options.containerClass);

        this.$element.addClass(this.options.stickyClass).attr({ 'data-resize': id });

        this.scrollCount = this.options.checkEvery;
        this.isStuck = false;
        $(window).one('load.zf.sticky', function () {
          if (_this.options.anchor !== '') {
            _this.$anchor = $('#' + _this.options.anchor);
          } else {
            _this._parsePoints();
          }

          _this._setSizes(function () {
            _this._calc(false);
          });
          _this._events(id.split('-').reverse().join('-'));
        });
      }

      /**
       * If using multiple elements as anchors, calculates the top and bottom pixel values the sticky thing should stick and unstick on.
       * @function
       * @private
       */

    }, {
      key: '_parsePoints',
      value: function _parsePoints() {
        var top = this.options.topAnchor,
            btm = this.options.btmAnchor,
            pts = [top, btm],
            breaks = {};
        if (top && btm) {

          for (var i = 0, len = pts.length; i < len && pts[i]; i++) {
            var pt;
            if (typeof pts[i] === 'number') {
              pt = pts[i];
            } else {
              var place = pts[i].split(':'),
                  anchor = $('#' + place[0]);

              pt = anchor.offset().top;
              if (place[1] && place[1].toLowerCase() === 'bottom') {
                pt += anchor[0].getBoundingClientRect().height;
              }
            }
            breaks[i] = pt;
          }
        } else {
          breaks = { 0: 1, 1: document.documentElement.scrollHeight };
        }

        this.points = breaks;
        return;
      }

      /**
       * Adds event handlers for the scrolling element.
       * @private
       * @param {String} id - psuedo-random id for unique scroll event listener.
       */

    }, {
      key: '_events',
      value: function _events(id) {
        var _this = this,
            scrollListener = this.scrollListener = 'scroll.zf.' + id;
        if (this.isOn) {
          return;
        }
        if (this.canStick) {
          this.isOn = true;
          $(window).off(scrollListener).on(scrollListener, function (e) {
            if (_this.scrollCount === 0) {
              _this.scrollCount = _this.options.checkEvery;
              _this._setSizes(function () {
                _this._calc(false, window.pageYOffset);
              });
            } else {
              _this.scrollCount--;
              _this._calc(false, window.pageYOffset);
            }
          });
        }

        this.$element.off('resizeme.zf.trigger').on('resizeme.zf.trigger', function (e, el) {
          _this._setSizes(function () {
            _this._calc(false);
            if (_this.canStick) {
              if (!_this.isOn) {
                _this._events(id);
              }
            } else if (_this.isOn) {
              _this._pauseListeners(scrollListener);
            }
          });
        });
      }

      /**
       * Removes event handlers for scroll and change events on anchor.
       * @fires Sticky#pause
       * @param {String} scrollListener - unique, namespaced scroll listener attached to `window`
       */

    }, {
      key: '_pauseListeners',
      value: function _pauseListeners(scrollListener) {
        this.isOn = false;
        $(window).off(scrollListener);

        /**
         * Fires when the plugin is paused due to resize event shrinking the view.
         * @event Sticky#pause
         * @private
         */
        this.$element.trigger('pause.zf.sticky');
      }

      /**
       * Called on every `scroll` event and on `_init`
       * fires functions based on booleans and cached values
       * @param {Boolean} checkSizes - true if plugin should recalculate sizes and breakpoints.
       * @param {Number} scroll - current scroll position passed from scroll event cb function. If not passed, defaults to `window.pageYOffset`.
       */

    }, {
      key: '_calc',
      value: function _calc(checkSizes, scroll) {
        if (checkSizes) {
          this._setSizes();
        }

        if (!this.canStick) {
          if (this.isStuck) {
            this._removeSticky(true);
          }
          return false;
        }

        if (!scroll) {
          scroll = window.pageYOffset;
        }

        if (scroll >= this.topPoint) {
          if (scroll <= this.bottomPoint) {
            if (!this.isStuck) {
              this._setSticky();
            }
          } else {
            if (this.isStuck) {
              this._removeSticky(false);
            }
          }
        } else {
          if (this.isStuck) {
            this._removeSticky(true);
          }
        }
      }

      /**
       * Causes the $element to become stuck.
       * Adds `position: fixed;`, and helper classes.
       * @fires Sticky#stuckto
       * @function
       * @private
       */

    }, {
      key: '_setSticky',
      value: function _setSticky() {
        var stickTo = this.options.stickTo,
            mrgn = stickTo === 'top' ? 'marginTop' : 'marginBottom',
            notStuckTo = stickTo === 'top' ? 'bottom' : 'top',
            css = {};

        css[mrgn] = this.options[mrgn] + 'em';
        css[stickTo] = 0;
        css[notStuckTo] = 'auto';
        css['left'] = this.$container.offset().left + parseInt(window.getComputedStyle(this.$container[0])["padding-left"], 10);
        this.isStuck = true;
        this.$element.removeClass('is-anchored is-at-' + notStuckTo).addClass('is-stuck is-at-' + stickTo).css(css)
        /**
         * Fires when the $element has become `position: fixed;`
         * Namespaced to `top` or `bottom`, e.g. `sticky.zf.stuckto:top`
         * @event Sticky#stuckto
         */
        .trigger('sticky.zf.stuckto:' + stickTo);
      }

      /**
       * Causes the $element to become unstuck.
       * Removes `position: fixed;`, and helper classes.
       * Adds other helper classes.
       * @param {Boolean} isTop - tells the function if the $element should anchor to the top or bottom of its $anchor element.
       * @fires Sticky#unstuckfrom
       * @private
       */

    }, {
      key: '_removeSticky',
      value: function _removeSticky(isTop) {
        var stickTo = this.options.stickTo,
            stickToTop = stickTo === 'top',
            css = {},
            anchorPt = (this.points ? this.points[1] - this.points[0] : this.anchorHeight) - this.elemHeight,
            mrgn = stickToTop ? 'marginTop' : 'marginBottom',
            notStuckTo = stickToTop ? 'bottom' : 'top',
            topOrBottom = isTop ? 'top' : 'bottom';

        css[mrgn] = 0;

        if (isTop && !stickToTop || stickToTop && !isTop) {
          css[stickTo] = anchorPt;
          css[notStuckTo] = 0;
        } else {
          css[stickTo] = 0;
          css[notStuckTo] = anchorPt;
        }

        css['left'] = '';
        this.isStuck = false;
        this.$element.removeClass('is-stuck is-at-' + stickTo).addClass('is-anchored is-at-' + topOrBottom).css(css)
        /**
         * Fires when the $element has become anchored.
         * Namespaced to `top` or `bottom`, e.g. `sticky.zf.unstuckfrom:bottom`
         * @event Sticky#unstuckfrom
         */
        .trigger('sticky.zf.unstuckfrom:' + topOrBottom);
      }

      /**
       * Sets the $element and $container sizes for plugin.
       * Calls `_setBreakPoints`.
       * @param {Function} cb - optional callback function to fire on completion of `_setBreakPoints`.
       * @private
       */

    }, {
      key: '_setSizes',
      value: function _setSizes(cb) {
        this.canStick = Foundation.MediaQuery.atLeast(this.options.stickyOn);
        if (!this.canStick) {
          cb();
        }
        var _this = this,
            newElemWidth = this.$container[0].getBoundingClientRect().width,
            comp = window.getComputedStyle(this.$container[0]),
            pdng = parseInt(comp['padding-right'], 10);

        if (this.$anchor && this.$anchor.length) {
          this.anchorHeight = this.$anchor[0].getBoundingClientRect().height;
        } else {
          this._parsePoints();
        }

        this.$element.css({
          'max-width': newElemWidth - pdng + 'px'
        });

        var newContainerHeight = this.$element[0].getBoundingClientRect().height || this.containerHeight;
        this.containerHeight = newContainerHeight;
        this.$container.css({
          height: newContainerHeight
        });
        this.elemHeight = newContainerHeight;

        if (this.isStuck) {
          this.$element.css({ "left": this.$container.offset().left + parseInt(comp['padding-left'], 10) });
        }

        this._setBreakPoints(newContainerHeight, function () {
          if (cb) {
            cb();
          }
        });
      }

      /**
       * Sets the upper and lower breakpoints for the element to become sticky/unsticky.
       * @param {Number} elemHeight - px value for sticky.$element height, calculated by `_setSizes`.
       * @param {Function} cb - optional callback function to be called on completion.
       * @private
       */

    }, {
      key: '_setBreakPoints',
      value: function _setBreakPoints(elemHeight, cb) {
        if (!this.canStick) {
          if (cb) {
            cb();
          } else {
            return false;
          }
        }
        var mTop = emCalc(this.options.marginTop),
            mBtm = emCalc(this.options.marginBottom),
            topPoint = this.points ? this.points[0] : this.$anchor.offset().top,
            bottomPoint = this.points ? this.points[1] : topPoint + this.anchorHeight,

        // topPoint = this.$anchor.offset().top || this.points[0],
        // bottomPoint = topPoint + this.anchorHeight || this.points[1],
        winHeight = window.innerHeight;

        if (this.options.stickTo === 'top') {
          topPoint -= mTop;
          bottomPoint -= elemHeight + mTop;
        } else if (this.options.stickTo === 'bottom') {
          topPoint -= winHeight - (elemHeight + mBtm);
          bottomPoint -= winHeight - mBtm;
        } else {
          //this would be the stickTo: both option... tricky
        }

        this.topPoint = topPoint;
        this.bottomPoint = bottomPoint;

        if (cb) {
          cb();
        }
      }

      /**
       * Destroys the current sticky element.
       * Resets the element to the top position first.
       * Removes event listeners, JS-added css properties and classes, and unwraps the $element if the JS added the $container.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this._removeSticky(true);

        this.$element.removeClass(this.options.stickyClass + ' is-anchored is-at-top').css({
          height: '',
          top: '',
          bottom: '',
          'max-width': ''
        }).off('resizeme.zf.trigger');

        this.$anchor.off('change.zf.sticky');
        $(window).off(this.scrollListener);

        if (this.wasWrapped) {
          this.$element.unwrap();
        } else {
          this.$container.removeClass(this.options.containerClass).css({
            height: ''
          });
        }
        Foundation.unregisterPlugin(this);
      }
    }]);

    return Sticky;
  }();

  Sticky.defaults = {
    /**
     * Customizable container template. Add your own classes for styling and sizing.
     * @option
     * @example '&lt;div data-sticky-container class="small-6 columns"&gt;&lt;/div&gt;'
     */
    container: '<div data-sticky-container></div>',
    /**
     * Location in the view the element sticks to.
     * @option
     * @example 'top'
     */
    stickTo: 'top',
    /**
     * If anchored to a single element, the id of that element.
     * @option
     * @example 'exampleId'
     */
    anchor: '',
    /**
     * If using more than one element as anchor points, the id of the top anchor.
     * @option
     * @example 'exampleId:top'
     */
    topAnchor: '',
    /**
     * If using more than one element as anchor points, the id of the bottom anchor.
     * @option
     * @example 'exampleId:bottom'
     */
    btmAnchor: '',
    /**
     * Margin, in `em`'s to apply to the top of the element when it becomes sticky.
     * @option
     * @example 1
     */
    marginTop: 1,
    /**
     * Margin, in `em`'s to apply to the bottom of the element when it becomes sticky.
     * @option
     * @example 1
     */
    marginBottom: 1,
    /**
     * Breakpoint string that is the minimum screen size an element should become sticky.
     * @option
     * @example 'medium'
     */
    stickyOn: 'medium',
    /**
     * Class applied to sticky element, and removed on destruction. Foundation defaults to `sticky`.
     * @option
     * @example 'sticky'
     */
    stickyClass: 'sticky',
    /**
     * Class applied to sticky container. Foundation defaults to `sticky-container`.
     * @option
     * @example 'sticky-container'
     */
    containerClass: 'sticky-container',
    /**
     * Number of scroll events between the plugin's recalculating sticky points. Setting it to `0` will cause it to recalc every scroll event, setting it to `-1` will prevent recalc on scroll.
     * @option
     * @example 50
     */
    checkEvery: -1
  };

  /**
   * Helper function to calculate em values
   * @param Number {em} - number of em's to calculate into pixels
   */
  function emCalc(em) {
    return parseInt(window.getComputedStyle(document.body, null).fontSize, 10) * em;
  }

  // Window exports
  Foundation.plugin(Sticky, 'Sticky');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Tabs module.
   * @module foundation.tabs
   * @requires foundation.util.keyboard
   * @requires foundation.util.timerAndImageLoader if tabs contain images
   */

  var Tabs = function () {
    /**
     * Creates a new instance of tabs.
     * @class
     * @fires Tabs#init
     * @param {jQuery} element - jQuery object to make into tabs.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Tabs(element, options) {
      _classCallCheck(this, Tabs);

      this.$element = element;
      this.options = $.extend({}, Tabs.defaults, this.$element.data(), options);

      this._init();
      Foundation.registerPlugin(this, 'Tabs');
      Foundation.Keyboard.register('Tabs', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'previous',
        'ARROW_DOWN': 'next',
        'ARROW_LEFT': 'previous'
        // 'TAB': 'next',
        // 'SHIFT_TAB': 'previous'
      });
    }

    /**
     * Initializes the tabs by showing and focusing (if autoFocus=true) the preset active tab.
     * @private
     */


    _createClass(Tabs, [{
      key: '_init',
      value: function _init() {
        var _this = this;

        this.$tabTitles = this.$element.find('.' + this.options.linkClass);
        this.$tabContent = $('[data-tabs-content="' + this.$element[0].id + '"]');

        this.$tabTitles.each(function () {
          var $elem = $(this),
              $link = $elem.find('a'),
              isActive = $elem.hasClass('is-active'),
              hash = $link[0].hash.slice(1),
              linkId = $link[0].id ? $link[0].id : hash + '-label',
              $tabContent = $('#' + hash);

          $elem.attr({ 'role': 'presentation' });

          $link.attr({
            'role': 'tab',
            'aria-controls': hash,
            'aria-selected': isActive,
            'id': linkId
          });

          $tabContent.attr({
            'role': 'tabpanel',
            'aria-hidden': !isActive,
            'aria-labelledby': linkId
          });

          if (isActive && _this.options.autoFocus) {
            $link.focus();
          }
        });

        if (this.options.matchHeight) {
          var $images = this.$tabContent.find('img');

          if ($images.length) {
            Foundation.onImagesLoaded($images, this._setHeight.bind(this));
          } else {
            this._setHeight();
          }
        }

        this._events();
      }

      /**
       * Adds event handlers for items within the tabs.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        this._addKeyHandler();
        this._addClickHandler();

        if (this.options.matchHeight) {
          $(window).on('changed.zf.mediaquery', this._setHeight.bind(this));
        }
      }

      /**
       * Adds click handlers for items within the tabs.
       * @private
       */

    }, {
      key: '_addClickHandler',
      value: function _addClickHandler() {
        var _this = this;

        this.$element.off('click.zf.tabs').on('click.zf.tabs', '.' + this.options.linkClass, function (e) {
          e.preventDefault();
          e.stopPropagation();
          if ($(this).hasClass('is-active')) {
            return;
          }
          _this._handleTabChange($(this));
        });
      }

      /**
       * Adds keyboard event handlers for items within the tabs.
       * @private
       */

    }, {
      key: '_addKeyHandler',
      value: function _addKeyHandler() {
        var _this = this;
        var $firstTab = _this.$element.find('li:first-of-type');
        var $lastTab = _this.$element.find('li:last-of-type');

        this.$tabTitles.off('keydown.zf.tabs').on('keydown.zf.tabs', function (e) {
          if (e.which === 9) return;
          e.stopPropagation();
          e.preventDefault();

          var $element = $(this),
              $elements = $element.parent('ul').children('li'),
              $prevElement,
              $nextElement;

          $elements.each(function (i) {
            if ($(this).is($element)) {
              if (_this.options.wrapOnKeys) {
                $prevElement = i === 0 ? $elements.last() : $elements.eq(i - 1);
                $nextElement = i === $elements.length - 1 ? $elements.first() : $elements.eq(i + 1);
              } else {
                $prevElement = $elements.eq(Math.max(0, i - 1));
                $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1));
              }
              return;
            }
          });

          // handle keyboard event with keyboard util
          Foundation.Keyboard.handleKey(e, 'Tabs', {
            open: function () {
              $element.find('[role="tab"]').focus();
              _this._handleTabChange($element);
            },
            previous: function () {
              $prevElement.find('[role="tab"]').focus();
              _this._handleTabChange($prevElement);
            },
            next: function () {
              $nextElement.find('[role="tab"]').focus();
              _this._handleTabChange($nextElement);
            }
          });
        });
      }

      /**
       * Opens the tab `$targetContent` defined by `$target`.
       * @param {jQuery} $target - Tab to open.
       * @fires Tabs#change
       * @function
       */

    }, {
      key: '_handleTabChange',
      value: function _handleTabChange($target) {
        var $tabLink = $target.find('[role="tab"]'),
            hash = $tabLink[0].hash,
            $targetContent = this.$tabContent.find(hash),
            $oldTab = this.$element.find('.' + this.options.linkClass + '.is-active').removeClass('is-active').find('[role="tab"]').attr({ 'aria-selected': 'false' });

        $('#' + $oldTab.attr('aria-controls')).removeClass('is-active').attr({ 'aria-hidden': 'true' });

        $target.addClass('is-active');

        $tabLink.attr({ 'aria-selected': 'true' });

        $targetContent.addClass('is-active').attr({ 'aria-hidden': 'false' });

        /**
         * Fires when the plugin has successfully changed tabs.
         * @event Tabs#change
         */
        this.$element.trigger('change.zf.tabs', [$target]);
      }

      /**
       * Public method for selecting a content pane to display.
       * @param {jQuery | String} elem - jQuery object or string of the id of the pane to display.
       * @function
       */

    }, {
      key: 'selectTab',
      value: function selectTab(elem) {
        var idStr;

        if (typeof elem === 'object') {
          idStr = elem[0].id;
        } else {
          idStr = elem;
        }

        if (idStr.indexOf('#') < 0) {
          idStr = '#' + idStr;
        }

        var $target = this.$tabTitles.find('[href="' + idStr + '"]').parent('.' + this.options.linkClass);

        this._handleTabChange($target);
      }
    }, {
      key: '_setHeight',

      /**
       * Sets the height of each panel to the height of the tallest panel.
       * If enabled in options, gets called on media query change.
       * If loading content via external source, can be called directly or with _reflow.
       * @function
       * @private
       */
      value: function _setHeight() {
        var max = 0;
        this.$tabContent.find('.' + this.options.panelClass).css('height', '').each(function () {
          var panel = $(this),
              isActive = panel.hasClass('is-active');

          if (!isActive) {
            panel.css({ 'visibility': 'hidden', 'display': 'block' });
          }

          var temp = this.getBoundingClientRect().height;

          if (!isActive) {
            panel.css({
              'visibility': '',
              'display': ''
            });
          }

          max = temp > max ? temp : max;
        }).css('height', max + 'px');
      }

      /**
       * Destroys an instance of an tabs.
       * @fires Tabs#destroyed
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.find('.' + this.options.linkClass).off('.zf.tabs').hide().end().find('.' + this.options.panelClass).hide();

        if (this.options.matchHeight) {
          $(window).off('changed.zf.mediaquery');
        }

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Tabs;
  }();

  Tabs.defaults = {
    /**
     * Allows the window to scroll to content of active pane on load if set to true.
     * @option
     * @example false
     */
    autoFocus: false,

    /**
     * Allows keyboard input to 'wrap' around the tab links.
     * @option
     * @example true
     */
    wrapOnKeys: true,

    /**
     * Allows the tab content panes to match heights if set to true.
     * @option
     * @example false
     */
    matchHeight: false,

    /**
     * Class applied to `li`'s in tab link list.
     * @option
     * @example 'tabs-title'
     */
    linkClass: 'tabs-title',

    /**
     * Class applied to the content containers.
     * @option
     * @example 'tabs-panel'
     */
    panelClass: 'tabs-panel'
  };

  function checkClass($elem) {
    return $elem.hasClass('is-active');
  }

  // Window exports
  Foundation.plugin(Tabs, 'Tabs');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Toggler module.
   * @module foundation.toggler
   * @requires foundation.util.motion
   * @requires foundation.util.triggers
   */

  var Toggler = function () {
    /**
     * Creates a new instance of Toggler.
     * @class
     * @fires Toggler#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */

    function Toggler(element, options) {
      _classCallCheck(this, Toggler);

      this.$element = element;
      this.options = $.extend({}, Toggler.defaults, element.data(), options);
      this.className = '';

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'Toggler');
    }

    /**
     * Initializes the Toggler plugin by parsing the toggle class from data-toggler, or animation classes from data-animate.
     * @function
     * @private
     */


    _createClass(Toggler, [{
      key: '_init',
      value: function _init() {
        var input;
        // Parse animation classes if they were set
        if (this.options.animate) {
          input = this.options.animate.split(' ');

          this.animationIn = input[0];
          this.animationOut = input[1] || null;
        }
        // Otherwise, parse toggle class
        else {
            input = this.$element.data('toggler');
            // Allow for a . at the beginning of the string
            this.className = input[0] === '.' ? input.slice(1) : input;
          }

        // Add ARIA attributes to triggers
        var id = this.$element[0].id;
        $('[data-open="' + id + '"], [data-close="' + id + '"], [data-toggle="' + id + '"]').attr('aria-controls', id);
        // If the target is hidden, add aria-hidden
        this.$element.attr('aria-expanded', this.$element.is(':hidden') ? false : true);
      }

      /**
       * Initializes events for the toggle trigger.
       * @function
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        this.$element.off('toggle.zf.trigger').on('toggle.zf.trigger', this.toggle.bind(this));
      }

      /**
       * Toggles the target class on the target element. An event is fired from the original trigger depending on if the resultant state was "on" or "off".
       * @function
       * @fires Toggler#on
       * @fires Toggler#off
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        this[this.options.animate ? '_toggleAnimate' : '_toggleClass']();
      }
    }, {
      key: '_toggleClass',
      value: function _toggleClass() {
        this.$element.toggleClass(this.className);

        var isOn = this.$element.hasClass(this.className);
        if (isOn) {
          /**
           * Fires if the target element has the class after a toggle.
           * @event Toggler#on
           */
          this.$element.trigger('on.zf.toggler');
        } else {
          /**
           * Fires if the target element does not have the class after a toggle.
           * @event Toggler#off
           */
          this.$element.trigger('off.zf.toggler');
        }

        this._updateARIA(isOn);
      }
    }, {
      key: '_toggleAnimate',
      value: function _toggleAnimate() {
        var _this = this;

        if (this.$element.is(':hidden')) {
          Foundation.Motion.animateIn(this.$element, this.animationIn, function () {
            _this._updateARIA(true);
            this.trigger('on.zf.toggler');
          });
        } else {
          Foundation.Motion.animateOut(this.$element, this.animationOut, function () {
            _this._updateARIA(false);
            this.trigger('off.zf.toggler');
          });
        }
      }
    }, {
      key: '_updateARIA',
      value: function _updateARIA(isOn) {
        this.$element.attr('aria-expanded', isOn ? true : false);
      }

      /**
       * Destroys the instance of Toggler on the element.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.off('.zf.toggler');
        Foundation.unregisterPlugin(this);
      }
    }]);

    return Toggler;
  }();

  Toggler.defaults = {
    /**
     * Tells the plugin if the element should animated when toggled.
     * @option
     * @example false
     */
    animate: false
  };

  // Window exports
  Foundation.plugin(Toggler, 'Toggler');
}(jQuery);
;'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

!function ($) {

  /**
   * Tooltip module.
   * @module foundation.tooltip
   * @requires foundation.util.box
   * @requires foundation.util.triggers
   */

  var Tooltip = function () {
    /**
     * Creates a new instance of a Tooltip.
     * @class
     * @fires Tooltip#init
     * @param {jQuery} element - jQuery object to attach a tooltip to.
     * @param {Object} options - object to extend the default configuration.
     */

    function Tooltip(element, options) {
      _classCallCheck(this, Tooltip);

      this.$element = element;
      this.options = $.extend({}, Tooltip.defaults, this.$element.data(), options);

      this.isActive = false;
      this.isClick = false;
      this._init();

      Foundation.registerPlugin(this, 'Tooltip');
    }

    /**
     * Initializes the tooltip by setting the creating the tip element, adding it's text, setting private variables and setting attributes on the anchor.
     * @private
     */


    _createClass(Tooltip, [{
      key: '_init',
      value: function _init() {
        var elemId = this.$element.attr('aria-describedby') || Foundation.GetYoDigits(6, 'tooltip');

        this.options.positionClass = this._getPositionClass(this.$element);
        this.options.tipText = this.options.tipText || this.$element.attr('title');
        this.template = this.options.template ? $(this.options.template) : this._buildTemplate(elemId);

        this.template.appendTo(document.body).text(this.options.tipText).hide();

        this.$element.attr({
          'title': '',
          'aria-describedby': elemId,
          'data-yeti-box': elemId,
          'data-toggle': elemId,
          'data-resize': elemId
        }).addClass(this.triggerClass);

        //helper variables to track movement on collisions
        this.usedPositions = [];
        this.counter = 4;
        this.classChanged = false;

        this._events();
      }

      /**
       * Grabs the current positioning class, if present, and returns the value or an empty string.
       * @private
       */

    }, {
      key: '_getPositionClass',
      value: function _getPositionClass(element) {
        if (!element) {
          return '';
        }
        // var position = element.attr('class').match(/top|left|right/g);
        var position = element[0].className.match(/\b(top|left|right)\b/g);
        position = position ? position[0] : '';
        return position;
      }
    }, {
      key: '_buildTemplate',

      /**
       * builds the tooltip element, adds attributes, and returns the template.
       * @private
       */
      value: function _buildTemplate(id) {
        var templateClasses = (this.options.tooltipClass + ' ' + this.options.positionClass + ' ' + this.options.templateClasses).trim();
        var $template = $('<div></div>').addClass(templateClasses).attr({
          'role': 'tooltip',
          'aria-hidden': true,
          'data-is-active': false,
          'data-is-focus': false,
          'id': id
        });
        return $template;
      }

      /**
       * Function that gets called if a collision event is detected.
       * @param {String} position - positioning class to try
       * @private
       */

    }, {
      key: '_reposition',
      value: function _reposition(position) {
        this.usedPositions.push(position ? position : 'bottom');

        //default, try switching to opposite side
        if (!position && this.usedPositions.indexOf('top') < 0) {
          this.template.addClass('top');
        } else if (position === 'top' && this.usedPositions.indexOf('bottom') < 0) {
          this.template.removeClass(position);
        } else if (position === 'left' && this.usedPositions.indexOf('right') < 0) {
          this.template.removeClass(position).addClass('right');
        } else if (position === 'right' && this.usedPositions.indexOf('left') < 0) {
          this.template.removeClass(position).addClass('left');
        }

        //if default change didn't work, try bottom or left first
        else if (!position && this.usedPositions.indexOf('top') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.template.addClass('left');
          } else if (position === 'top' && this.usedPositions.indexOf('bottom') > -1 && this.usedPositions.indexOf('left') < 0) {
            this.template.removeClass(position).addClass('left');
          } else if (position === 'left' && this.usedPositions.indexOf('right') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.template.removeClass(position);
          } else if (position === 'right' && this.usedPositions.indexOf('left') > -1 && this.usedPositions.indexOf('bottom') < 0) {
            this.template.removeClass(position);
          }
          //if nothing cleared, set to bottom
          else {
              this.template.removeClass(position);
            }
        this.classChanged = true;
        this.counter--;
      }

      /**
       * sets the position class of an element and recursively calls itself until there are no more possible positions to attempt, or the tooltip element is no longer colliding.
       * if the tooltip is larger than the screen width, default to full width - any user selected margin
       * @private
       */

    }, {
      key: '_setPosition',
      value: function _setPosition() {
        var position = this._getPositionClass(this.template),
            $tipDims = Foundation.Box.GetDimensions(this.template),
            $anchorDims = Foundation.Box.GetDimensions(this.$element),
            direction = position === 'left' ? 'left' : position === 'right' ? 'left' : 'top',
            param = direction === 'top' ? 'height' : 'width',
            offset = param === 'height' ? this.options.vOffset : this.options.hOffset,
            _this = this;

        if ($tipDims.width >= $tipDims.windowDims.width || !this.counter && !Foundation.Box.ImNotTouchingYou(this.template)) {
          this.template.offset(Foundation.Box.GetOffsets(this.template, this.$element, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
            // this.$element.offset(Foundation.GetOffsets(this.template, this.$element, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
            'width': $anchorDims.windowDims.width - this.options.hOffset * 2,
            'height': 'auto'
          });
          return false;
        }

        this.template.offset(Foundation.Box.GetOffsets(this.template, this.$element, 'center ' + (position || 'bottom'), this.options.vOffset, this.options.hOffset));

        while (!Foundation.Box.ImNotTouchingYou(this.template) && this.counter) {
          this._reposition(position);
          this._setPosition();
        }
      }

      /**
       * reveals the tooltip, and fires an event to close any other open tooltips on the page
       * @fires Tooltip#closeme
       * @fires Tooltip#show
       * @function
       */

    }, {
      key: 'show',
      value: function show() {
        if (this.options.showOn !== 'all' && !Foundation.MediaQuery.atLeast(this.options.showOn)) {
          // console.error('The screen is too small to display this tooltip');
          return false;
        }

        var _this = this;
        this.template.css('visibility', 'hidden').show();
        this._setPosition();

        /**
         * Fires to close all other open tooltips on the page
         * @event Closeme#tooltip
         */
        this.$element.trigger('closeme.zf.tooltip', this.template.attr('id'));

        this.template.attr({
          'data-is-active': true,
          'aria-hidden': false
        });
        _this.isActive = true;
        // console.log(this.template);
        this.template.stop().hide().css('visibility', '').fadeIn(this.options.fadeInDuration, function () {
          //maybe do stuff?
        });
        /**
         * Fires when the tooltip is shown
         * @event Tooltip#show
         */
        this.$element.trigger('show.zf.tooltip');
      }

      /**
       * Hides the current tooltip, and resets the positioning class if it was changed due to collision
       * @fires Tooltip#hide
       * @function
       */

    }, {
      key: 'hide',
      value: function hide() {
        // console.log('hiding', this.$element.data('yeti-box'));
        var _this = this;
        this.template.stop().attr({
          'aria-hidden': true,
          'data-is-active': false
        }).fadeOut(this.options.fadeOutDuration, function () {
          _this.isActive = false;
          _this.isClick = false;
          if (_this.classChanged) {
            _this.template.removeClass(_this._getPositionClass(_this.template)).addClass(_this.options.positionClass);

            _this.usedPositions = [];
            _this.counter = 4;
            _this.classChanged = false;
          }
        });
        /**
         * fires when the tooltip is hidden
         * @event Tooltip#hide
         */
        this.$element.trigger('hide.zf.tooltip');
      }

      /**
       * adds event listeners for the tooltip and its anchor
       * TODO combine some of the listeners like focus and mouseenter, etc.
       * @private
       */

    }, {
      key: '_events',
      value: function _events() {
        var _this = this;
        var $template = this.template;
        var isFocus = false;

        if (!this.options.disableHover) {

          this.$element.on('mouseenter.zf.tooltip', function (e) {
            if (!_this.isActive) {
              _this.timeout = setTimeout(function () {
                _this.show();
              }, _this.options.hoverDelay);
            }
          }).on('mouseleave.zf.tooltip', function (e) {
            clearTimeout(_this.timeout);
            if (!isFocus || !_this.isClick && _this.options.clickOpen) {
              _this.hide();
            }
          });
        }

        if (this.options.clickOpen) {
          this.$element.on('mousedown.zf.tooltip', function (e) {
            e.stopImmediatePropagation();
            if (_this.isClick) {
              _this.hide();
              // _this.isClick = false;
            } else {
                _this.isClick = true;
                if ((_this.options.disableHover || !_this.$element.attr('tabindex')) && !_this.isActive) {
                  _this.show();
                }
              }
          });
        }

        if (!this.options.disableForTouch) {
          this.$element.on('tap.zf.tooltip touchend.zf.tooltip', function (e) {
            _this.isActive ? _this.hide() : _this.show();
          });
        }

        this.$element.on({
          // 'toggle.zf.trigger': this.toggle.bind(this),
          // 'close.zf.trigger': this.hide.bind(this)
          'close.zf.trigger': this.hide.bind(this)
        });

        this.$element.on('focus.zf.tooltip', function (e) {
          isFocus = true;
          // console.log(_this.isClick);
          if (_this.isClick) {
            return false;
          } else {
            // $(window)
            _this.show();
          }
        }).on('focusout.zf.tooltip', function (e) {
          isFocus = false;
          _this.isClick = false;
          _this.hide();
        }).on('resizeme.zf.trigger', function () {
          if (_this.isActive) {
            _this._setPosition();
          }
        });
      }

      /**
       * adds a toggle method, in addition to the static show() & hide() functions
       * @function
       */

    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.isActive) {
          this.hide();
        } else {
          this.show();
        }
      }

      /**
       * Destroys an instance of tooltip, removes template element from the view.
       * @function
       */

    }, {
      key: 'destroy',
      value: function destroy() {
        this.$element.attr('title', this.template.text()).off('.zf.trigger .zf.tootip')
        //  .removeClass('has-tip')
        .removeAttr('aria-describedby').removeAttr('data-yeti-box').removeAttr('data-toggle').removeAttr('data-resize');

        this.template.remove();

        Foundation.unregisterPlugin(this);
      }
    }]);

    return Tooltip;
  }();

  Tooltip.defaults = {
    disableForTouch: false,
    /**
     * Time, in ms, before a tooltip should open on hover.
     * @option
     * @example 200
     */
    hoverDelay: 200,
    /**
     * Time, in ms, a tooltip should take to fade into view.
     * @option
     * @example 150
     */
    fadeInDuration: 150,
    /**
     * Time, in ms, a tooltip should take to fade out of view.
     * @option
     * @example 150
     */
    fadeOutDuration: 150,
    /**
     * Disables hover events from opening the tooltip if set to true
     * @option
     * @example false
     */
    disableHover: false,
    /**
     * Optional addtional classes to apply to the tooltip template on init.
     * @option
     * @example 'my-cool-tip-class'
     */
    templateClasses: '',
    /**
     * Non-optional class added to tooltip templates. Foundation default is 'tooltip'.
     * @option
     * @example 'tooltip'
     */
    tooltipClass: 'tooltip',
    /**
     * Class applied to the tooltip anchor element.
     * @option
     * @example 'has-tip'
     */
    triggerClass: 'has-tip',
    /**
     * Minimum breakpoint size at which to open the tooltip.
     * @option
     * @example 'small'
     */
    showOn: 'small',
    /**
     * Custom template to be used to generate markup for tooltip.
     * @option
     * @example '&lt;div class="tooltip"&gt;&lt;/div&gt;'
     */
    template: '',
    /**
     * Text displayed in the tooltip template on open.
     * @option
     * @example 'Some cool space fact here.'
     */
    tipText: '',
    touchCloseText: 'Tap to close.',
    /**
     * Allows the tooltip to remain open if triggered with a click or touch event.
     * @option
     * @example true
     */
    clickOpen: true,
    /**
     * Additional positioning classes, set by the JS
     * @option
     * @example 'top'
     */
    positionClass: '',
    /**
     * Distance, in pixels, the template should push away from the anchor on the Y axis.
     * @option
     * @example 10
     */
    vOffset: 10,
    /**
     * Distance, in pixels, the template should push away from the anchor on the X axis, if aligned to a side.
     * @option
     * @example 12
     */
    hOffset: 12
  };

  /**
   * TODO utilize resize event trigger
   */

  // Window exports
  Foundation.plugin(Tooltip, 'Tooltip');
}(jQuery);
;'use strict';

// Polyfill for requestAnimationFrame

(function () {
  if (!Date.now) Date.now = function () {
    return new Date().getTime();
  };

  var vendors = ['webkit', 'moz'];
  for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
    var vp = vendors[i];
    window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
  }
  if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
    var lastTime = 0;
    window.requestAnimationFrame = function (callback) {
      var now = Date.now();
      var nextTime = Math.max(lastTime + 16, now);
      return setTimeout(function () {
        callback(lastTime = nextTime);
      }, nextTime - now);
    };
    window.cancelAnimationFrame = clearTimeout;
  }
})();

var initClasses = ['mui-enter', 'mui-leave'];
var activeClasses = ['mui-enter-active', 'mui-leave-active'];

// Find the right "transitionend" event for this browser
var endEvent = function () {
  var transitions = {
    'transition': 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'transitionend',
    'OTransition': 'otransitionend'
  };
  var elem = window.document.createElement('div');

  for (var t in transitions) {
    if (typeof elem.style[t] !== 'undefined') {
      return transitions[t];
    }
  }

  return null;
}();

function animate(isIn, element, animation, cb) {
  element = $(element).eq(0);

  if (!element.length) return;

  if (endEvent === null) {
    isIn ? element.show() : element.hide();
    cb();
    return;
  }

  var initClass = isIn ? initClasses[0] : initClasses[1];
  var activeClass = isIn ? activeClasses[0] : activeClasses[1];

  // Set up the animation
  reset();
  element.addClass(animation);
  element.css('transition', 'none');
  requestAnimationFrame(function () {
    element.addClass(initClass);
    if (isIn) element.show();
  });

  // Start the animation
  requestAnimationFrame(function () {
    element[0].offsetWidth;
    element.css('transition', '');
    element.addClass(activeClass);
  });

  // Clean up the animation when it finishes
  element.one('transitionend', finish);

  // Hides the element (for out animations), resets the element, and runs a callback
  function finish() {
    if (!isIn) element.hide();
    reset();
    if (cb) cb.apply(element);
  }

  // Resets transitions and removes motion-specific classes
  function reset() {
    element[0].style.transitionDuration = 0;
    element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
  }
}

var MotionUI = {
  animateIn: function (element, animation, cb) {
    animate(true, element, animation, cb);
  },

  animateOut: function (element, animation, cb) {
    animate(false, element, animation, cb);
  }
};
;"use strict";

/*! skrollr 0.6.30 (2015-06-19) | Alexander Prinzhorn - https://github.com/Prinzhorn/skrollr | Free to use under terms of MIT license */
!function (a, b, c) {
  "use strict";
  function d(c) {
    if (e = b.documentElement, f = b.body, T(), ha = this, c = c || {}, ma = c.constants || {}, c.easing) for (var d in c.easing) {
      W[d] = c.easing[d];
    }ta = c.edgeStrategy || "set", ka = { beforerender: c.beforerender, render: c.render, keyframe: c.keyframe }, la = c.forceHeight !== !1, la && (Ka = c.scale || 1), na = c.mobileDeceleration || y, pa = c.smoothScrolling !== !1, qa = c.smoothScrollingDuration || A, ra = { targetTop: ha.getScrollTop() }, Sa = (c.mobileCheck || function () {
      return (/Android|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent || navigator.vendor || a.opera)
      );
    })(), Sa ? (ja = b.getElementById(c.skrollrBody || z), ja && ga(), X(), Ea(e, [s, v], [t])) : Ea(e, [s, u], [t]), ha.refresh(), wa(a, "resize orientationchange", function () {
      var a = e.clientWidth,
          b = e.clientHeight;(b !== Pa || a !== Oa) && (Pa = b, Oa = a, Qa = !0);
    });var g = U();return function h() {
      $(), va = g(h);
    }(), ha;
  }var e,
      f,
      g = { get: function () {
      return ha;
    }, init: function (a) {
      return ha || new d(a);
    }, VERSION: "0.6.29" },
      h = Object.prototype.hasOwnProperty,
      i = a.Math,
      j = a.getComputedStyle,
      k = "touchstart",
      l = "touchmove",
      m = "touchcancel",
      n = "touchend",
      o = "skrollable",
      p = o + "-before",
      q = o + "-between",
      r = o + "-after",
      s = "skrollr",
      t = "no-" + s,
      u = s + "-desktop",
      v = s + "-mobile",
      w = "linear",
      x = 1e3,
      y = .004,
      z = "skrollr-body",
      A = 200,
      B = "start",
      C = "end",
      D = "center",
      E = "bottom",
      F = "___skrollable_id",
      G = /^(?:input|textarea|button|select)$/i,
      H = /^\s+|\s+$/g,
      I = /^data(?:-(_\w+))?(?:-?(-?\d*\.?\d+p?))?(?:-?(start|end|top|center|bottom))?(?:-?(top|center|bottom))?$/,
      J = /\s*(@?[\w\-\[\]]+)\s*:\s*(.+?)\s*(?:;|$)/gi,
      K = /^(@?[a-z\-]+)\[(\w+)\]$/,
      L = /-([a-z0-9_])/g,
      M = function (a, b) {
    return b.toUpperCase();
  },
      N = /[\-+]?[\d]*\.?[\d]+/g,
      O = /\{\?\}/g,
      P = /rgba?\(\s*-?\d+\s*,\s*-?\d+\s*,\s*-?\d+/g,
      Q = /[a-z\-]+-gradient/g,
      R = "",
      S = "",
      T = function () {
    var a = /^(?:O|Moz|webkit|ms)|(?:-(?:o|moz|webkit|ms)-)/;if (j) {
      var b = j(f, null);for (var c in b) {
        if (R = c.match(a) || +c == c && b[c].match(a)) break;
      }if (!R) return void (R = S = "");R = R[0], "-" === R.slice(0, 1) ? (S = R, R = { "-webkit-": "webkit", "-moz-": "Moz", "-ms-": "ms", "-o-": "O" }[R]) : S = "-" + R.toLowerCase() + "-";
    }
  },
      U = function () {
    var b = a.requestAnimationFrame || a[R.toLowerCase() + "RequestAnimationFrame"],
        c = Ha();return (Sa || !b) && (b = function (b) {
      var d = Ha() - c,
          e = i.max(0, 1e3 / 60 - d);return a.setTimeout(function () {
        c = Ha(), b();
      }, e);
    }), b;
  },
      V = function () {
    var b = a.cancelAnimationFrame || a[R.toLowerCase() + "CancelAnimationFrame"];return (Sa || !b) && (b = function (b) {
      return a.clearTimeout(b);
    }), b;
  },
      W = { begin: function () {
      return 0;
    }, end: function () {
      return 1;
    }, linear: function (a) {
      return a;
    }, quadratic: function (a) {
      return a * a;
    }, cubic: function (a) {
      return a * a * a;
    }, swing: function (a) {
      return -i.cos(a * i.PI) / 2 + .5;
    }, sqrt: function (a) {
      return i.sqrt(a);
    }, outCubic: function (a) {
      return i.pow(a - 1, 3) + 1;
    }, bounce: function (a) {
      var b;if (.5083 >= a) b = 3;else if (.8489 >= a) b = 9;else if (.96208 >= a) b = 27;else {
        if (!(.99981 >= a)) return 1;b = 91;
      }return 1 - i.abs(3 * i.cos(a * b * 1.028) / b);
    } };d.prototype.refresh = function (a) {
    var d,
        e,
        f = !1;for (a === c ? (f = !0, ia = [], Ra = 0, a = b.getElementsByTagName("*")) : a.length === c && (a = [a]), d = 0, e = a.length; e > d; d++) {
      var g = a[d],
          h = g,
          i = [],
          j = pa,
          k = ta,
          l = !1;if (f && F in g && delete g[F], g.attributes) {
        for (var m = 0, n = g.attributes.length; n > m; m++) {
          var p = g.attributes[m];if ("data-anchor-target" !== p.name) {
            if ("data-smooth-scrolling" !== p.name) {
              if ("data-edge-strategy" !== p.name) {
                if ("data-emit-events" !== p.name) {
                  var q = p.name.match(I);if (null !== q) {
                    var r = { props: p.value, element: g, eventType: p.name.replace(L, M) };i.push(r);var s = q[1];s && (r.constant = s.substr(1));var t = q[2];/p$/.test(t) ? (r.isPercentage = !0, r.offset = (0 | t.slice(0, -1)) / 100) : r.offset = 0 | t;var u = q[3],
                        v = q[4] || u;u && u !== B && u !== C ? (r.mode = "relative", r.anchors = [u, v]) : (r.mode = "absolute", u === C ? r.isEnd = !0 : r.isPercentage || (r.offset = r.offset * Ka));
                  }
                } else l = !0;
              } else k = p.value;
            } else j = "off" !== p.value;
          } else if (h = b.querySelector(p.value), null === h) throw 'Unable to find anchor target "' + p.value + '"';
        }if (i.length) {
          var w, x, y;!f && F in g ? (y = g[F], w = ia[y].styleAttr, x = ia[y].classAttr) : (y = g[F] = Ra++, w = g.style.cssText, x = Da(g)), ia[y] = { element: g, styleAttr: w, classAttr: x, anchorTarget: h, keyFrames: i, smoothScrolling: j, edgeStrategy: k, emitEvents: l, lastFrameIndex: -1 }, Ea(g, [o], []);
        }
      }
    }for (Aa(), d = 0, e = a.length; e > d; d++) {
      var z = ia[a[d][F]];z !== c && (_(z), ba(z));
    }return ha;
  }, d.prototype.relativeToAbsolute = function (a, b, c) {
    var d = e.clientHeight,
        f = a.getBoundingClientRect(),
        g = f.top,
        h = f.bottom - f.top;return b === E ? g -= d : b === D && (g -= d / 2), c === E ? g += h : c === D && (g += h / 2), g += ha.getScrollTop(), g + .5 | 0;
  }, d.prototype.animateTo = function (a, b) {
    b = b || {};var d = Ha(),
        e = ha.getScrollTop(),
        f = b.duration === c ? x : b.duration;return oa = { startTop: e, topDiff: a - e, targetTop: a, duration: f, startTime: d, endTime: d + f, easing: W[b.easing || w], done: b.done }, oa.topDiff || (oa.done && oa.done.call(ha, !1), oa = c), ha;
  }, d.prototype.stopAnimateTo = function () {
    oa && oa.done && oa.done.call(ha, !0), oa = c;
  }, d.prototype.isAnimatingTo = function () {
    return !!oa;
  }, d.prototype.isMobile = function () {
    return Sa;
  }, d.prototype.setScrollTop = function (b, c) {
    return sa = c === !0, Sa ? Ta = i.min(i.max(b, 0), Ja) : a.scrollTo(0, b), ha;
  }, d.prototype.getScrollTop = function () {
    return Sa ? Ta : a.pageYOffset || e.scrollTop || f.scrollTop || 0;
  }, d.prototype.getMaxScrollTop = function () {
    return Ja;
  }, d.prototype.on = function (a, b) {
    return ka[a] = b, ha;
  }, d.prototype.off = function (a) {
    return delete ka[a], ha;
  }, d.prototype.destroy = function () {
    var a = V();a(va), ya(), Ea(e, [t], [s, u, v]);for (var b = 0, d = ia.length; d > b; b++) {
      fa(ia[b].element);
    }e.style.overflow = f.style.overflow = "", e.style.height = f.style.height = "", ja && g.setStyle(ja, "transform", "none"), ha = c, ja = c, ka = c, la = c, Ja = 0, Ka = 1, ma = c, na = c, La = "down", Ma = -1, Oa = 0, Pa = 0, Qa = !1, oa = c, pa = c, qa = c, ra = c, sa = c, Ra = 0, ta = c, Sa = !1, Ta = 0, ua = c;
  };var X = function () {
    var d, g, h, j, o, p, q, r, s, t, u, v;wa(e, [k, l, m, n].join(" "), function (a) {
      var e = a.changedTouches[0];for (j = a.target; 3 === j.nodeType;) {
        j = j.parentNode;
      }switch (o = e.clientY, p = e.clientX, t = a.timeStamp, G.test(j.tagName) || a.preventDefault(), a.type) {case k:
          d && d.blur(), ha.stopAnimateTo(), d = j, g = q = o, h = p, s = t;break;case l:
          G.test(j.tagName) && b.activeElement !== j && a.preventDefault(), r = o - q, v = t - u, ha.setScrollTop(Ta - r, !0), q = o, u = t;break;default:case m:case n:
          var f = g - o,
              w = h - p,
              x = w * w + f * f;if (49 > x) {
            if (!G.test(d.tagName)) {
              d.focus();var y = b.createEvent("MouseEvents");y.initMouseEvent("click", !0, !0, a.view, 1, e.screenX, e.screenY, e.clientX, e.clientY, a.ctrlKey, a.altKey, a.shiftKey, a.metaKey, 0, null), d.dispatchEvent(y);
            }return;
          }d = c;var z = r / v;z = i.max(i.min(z, 3), -3);var A = i.abs(z / na),
              B = z * A + .5 * na * A * A,
              C = ha.getScrollTop() - B,
              D = 0;C > Ja ? (D = (Ja - C) / B, C = Ja) : 0 > C && (D = -C / B, C = 0), A *= 1 - D, ha.animateTo(C + .5 | 0, { easing: "outCubic", duration: A });}
    }), a.scrollTo(0, 0), e.style.overflow = f.style.overflow = "hidden";
  },
      Y = function () {
    var a,
        b,
        c,
        d,
        f,
        g,
        h,
        j,
        k,
        l,
        m,
        n = e.clientHeight,
        o = Ba();for (j = 0, k = ia.length; k > j; j++) {
      for (a = ia[j], b = a.element, c = a.anchorTarget, d = a.keyFrames, f = 0, g = d.length; g > f; f++) {
        h = d[f], l = h.offset, m = o[h.constant] || 0, h.frame = l, h.isPercentage && (l *= n, h.frame = l), "relative" === h.mode && (fa(b), h.frame = ha.relativeToAbsolute(c, h.anchors[0], h.anchors[1]) - l, fa(b, !0)), h.frame += m, la && !h.isEnd && h.frame > Ja && (Ja = h.frame);
      }
    }for (Ja = i.max(Ja, Ca()), j = 0, k = ia.length; k > j; j++) {
      for (a = ia[j], d = a.keyFrames, f = 0, g = d.length; g > f; f++) {
        h = d[f], m = o[h.constant] || 0, h.isEnd && (h.frame = Ja - h.offset + m);
      }a.keyFrames.sort(Ia);
    }
  },
      Z = function (a, b) {
    for (var c = 0, d = ia.length; d > c; c++) {
      var e,
          f,
          i = ia[c],
          j = i.element,
          k = i.smoothScrolling ? a : b,
          l = i.keyFrames,
          m = l.length,
          n = l[0],
          s = l[l.length - 1],
          t = k < n.frame,
          u = k > s.frame,
          v = t ? n : s,
          w = i.emitEvents,
          x = i.lastFrameIndex;if (t || u) {
        if (t && -1 === i.edge || u && 1 === i.edge) continue;switch (t ? (Ea(j, [p], [r, q]), w && x > -1 && (za(j, n.eventType, La), i.lastFrameIndex = -1)) : (Ea(j, [r], [p, q]), w && m > x && (za(j, s.eventType, La), i.lastFrameIndex = m)), i.edge = t ? -1 : 1, i.edgeStrategy) {case "reset":
            fa(j);continue;case "ease":
            k = v.frame;break;default:case "set":
            var y = v.props;for (e in y) {
              h.call(y, e) && (f = ea(y[e].value), 0 === e.indexOf("@") ? j.setAttribute(e.substr(1), f) : g.setStyle(j, e, f));
            }continue;}
      } else 0 !== i.edge && (Ea(j, [o, q], [p, r]), i.edge = 0);for (var z = 0; m - 1 > z; z++) {
        if (k >= l[z].frame && k <= l[z + 1].frame) {
          var A = l[z],
              B = l[z + 1];for (e in A.props) {
            if (h.call(A.props, e)) {
              var C = (k - A.frame) / (B.frame - A.frame);C = A.props[e].easing(C), f = da(A.props[e].value, B.props[e].value, C), f = ea(f), 0 === e.indexOf("@") ? j.setAttribute(e.substr(1), f) : g.setStyle(j, e, f);
            }
          }w && x !== z && ("down" === La ? za(j, A.eventType, La) : za(j, B.eventType, La), i.lastFrameIndex = z);break;
        }
      }
    }
  },
      $ = function () {
    Qa && (Qa = !1, Aa());var a,
        b,
        d = ha.getScrollTop(),
        e = Ha();if (oa) e >= oa.endTime ? (d = oa.targetTop, a = oa.done, oa = c) : (b = oa.easing((e - oa.startTime) / oa.duration), d = oa.startTop + b * oa.topDiff | 0), ha.setScrollTop(d, !0);else if (!sa) {
      var f = ra.targetTop - d;f && (ra = { startTop: Ma, topDiff: d - Ma, targetTop: d, startTime: Na, endTime: Na + qa }), e <= ra.endTime && (b = W.sqrt((e - ra.startTime) / qa), d = ra.startTop + b * ra.topDiff | 0);
    }if (sa || Ma !== d) {
      La = d > Ma ? "down" : Ma > d ? "up" : La, sa = !1;var h = { curTop: d, lastTop: Ma, maxTop: Ja, direction: La },
          i = ka.beforerender && ka.beforerender.call(ha, h);i !== !1 && (Z(d, ha.getScrollTop()), Sa && ja && g.setStyle(ja, "transform", "translate(0, " + -Ta + "px) " + ua), Ma = d, ka.render && ka.render.call(ha, h)), a && a.call(ha, !1);
    }Na = e;
  },
      _ = function (a) {
    for (var b = 0, c = a.keyFrames.length; c > b; b++) {
      for (var d, e, f, g, h = a.keyFrames[b], i = {}; null !== (g = J.exec(h.props));) {
        f = g[1], e = g[2], d = f.match(K), null !== d ? (f = d[1], d = d[2]) : d = w, e = e.indexOf("!") ? aa(e) : [e.slice(1)], i[f] = { value: e, easing: W[d] };
      }h.props = i;
    }
  },
      aa = function (a) {
    var b = [];return P.lastIndex = 0, a = a.replace(P, function (a) {
      return a.replace(N, function (a) {
        return a / 255 * 100 + "%";
      });
    }), S && (Q.lastIndex = 0, a = a.replace(Q, function (a) {
      return S + a;
    })), a = a.replace(N, function (a) {
      return b.push(+a), "{?}";
    }), b.unshift(a), b;
  },
      ba = function (a) {
    var b,
        c,
        d = {};for (b = 0, c = a.keyFrames.length; c > b; b++) {
      ca(a.keyFrames[b], d);
    }for (d = {}, b = a.keyFrames.length - 1; b >= 0; b--) {
      ca(a.keyFrames[b], d);
    }
  },
      ca = function (a, b) {
    var c;for (c in b) {
      h.call(a.props, c) || (a.props[c] = b[c]);
    }for (c in a.props) {
      b[c] = a.props[c];
    }
  },
      da = function (a, b, c) {
    var d,
        e = a.length;if (e !== b.length) throw "Can't interpolate between \"" + a[0] + '" and "' + b[0] + '"';var f = [a[0]];for (d = 1; e > d; d++) {
      f[d] = a[d] + (b[d] - a[d]) * c;
    }return f;
  },
      ea = function (a) {
    var b = 1;return O.lastIndex = 0, a[0].replace(O, function () {
      return a[b++];
    });
  },
      fa = function (a, b) {
    a = [].concat(a);for (var c, d, e = 0, f = a.length; f > e; e++) {
      d = a[e], c = ia[d[F]], c && (b ? (d.style.cssText = c.dirtyStyleAttr, Ea(d, c.dirtyClassAttr)) : (c.dirtyStyleAttr = d.style.cssText, c.dirtyClassAttr = Da(d), d.style.cssText = c.styleAttr, Ea(d, c.classAttr)));
    }
  },
      ga = function () {
    ua = "translateZ(0)", g.setStyle(ja, "transform", ua);var a = j(ja),
        b = a.getPropertyValue("transform"),
        c = a.getPropertyValue(S + "transform"),
        d = b && "none" !== b || c && "none" !== c;d || (ua = "");
  };g.setStyle = function (a, b, c) {
    var d = a.style;if (b = b.replace(L, M).replace("-", ""), "zIndex" === b) isNaN(c) ? d[b] = c : d[b] = "" + (0 | c);else if ("float" === b) d.styleFloat = d.cssFloat = c;else try {
      R && (d[R + b.slice(0, 1).toUpperCase() + b.slice(1)] = c), d[b] = c;
    } catch (e) {}
  };var ha,
      ia,
      ja,
      ka,
      la,
      ma,
      na,
      oa,
      pa,
      qa,
      ra,
      sa,
      ta,
      ua,
      va,
      wa = g.addEvent = function (b, c, d) {
    var e = function (b) {
      return b = b || a.event, b.target || (b.target = b.srcElement), b.preventDefault || (b.preventDefault = function () {
        b.returnValue = !1, b.defaultPrevented = !0;
      }), d.call(this, b);
    };c = c.split(" ");for (var f, g = 0, h = c.length; h > g; g++) {
      f = c[g], b.addEventListener ? b.addEventListener(f, d, !1) : b.attachEvent("on" + f, e), Ua.push({ element: b, name: f, listener: d });
    }
  },
      xa = g.removeEvent = function (a, b, c) {
    b = b.split(" ");for (var d = 0, e = b.length; e > d; d++) {
      a.removeEventListener ? a.removeEventListener(b[d], c, !1) : a.detachEvent("on" + b[d], c);
    }
  },
      ya = function () {
    for (var a, b = 0, c = Ua.length; c > b; b++) {
      a = Ua[b], xa(a.element, a.name, a.listener);
    }Ua = [];
  },
      za = function (a, b, c) {
    ka.keyframe && ka.keyframe.call(ha, a, b, c);
  },
      Aa = function () {
    var a = ha.getScrollTop();Ja = 0, la && !Sa && (f.style.height = ""), Y(), la && !Sa && (f.style.height = Ja + e.clientHeight + "px"), Sa ? ha.setScrollTop(i.min(ha.getScrollTop(), Ja)) : ha.setScrollTop(a, !0), sa = !0;
  },
      Ba = function () {
    var a,
        b,
        c = e.clientHeight,
        d = {};for (a in ma) {
      b = ma[a], "function" == typeof b ? b = b.call(ha) : /p$/.test(b) && (b = b.slice(0, -1) / 100 * c), d[a] = b;
    }return d;
  },
      Ca = function () {
    var a,
        b = 0;return ja && (b = i.max(ja.offsetHeight, ja.scrollHeight)), a = i.max(b, f.scrollHeight, f.offsetHeight, e.scrollHeight, e.offsetHeight, e.clientHeight), a - e.clientHeight;
  },
      Da = function (b) {
    var c = "className";return a.SVGElement && b instanceof a.SVGElement && (b = b[c], c = "baseVal"), b[c];
  },
      Ea = function (b, d, e) {
    var f = "className";if (a.SVGElement && b instanceof a.SVGElement && (b = b[f], f = "baseVal"), e === c) return void (b[f] = d);for (var g = b[f], h = 0, i = e.length; i > h; h++) {
      g = Ga(g).replace(Ga(e[h]), " ");
    }g = Fa(g);for (var j = 0, k = d.length; k > j; j++) {
      -1 === Ga(g).indexOf(Ga(d[j])) && (g += " " + d[j]);
    }b[f] = Fa(g);
  },
      Fa = function (a) {
    return a.replace(H, "");
  },
      Ga = function (a) {
    return " " + a + " ";
  },
      Ha = Date.now || function () {
    return +new Date();
  },
      Ia = function (a, b) {
    return a.frame - b.frame;
  },
      Ja = 0,
      Ka = 1,
      La = "down",
      Ma = -1,
      Na = Ha(),
      Oa = 0,
      Pa = 0,
      Qa = !1,
      Ra = 0,
      Sa = !1,
      Ta = 0,
      Ua = [];"function" == typeof define && define.amd ? define([], function () {
    return g;
  }) : "undefined" != typeof module && module.exports ? module.exports = g : a.skrollr = g;
}(window, document);
;"use strict";

function isiPhone() {
  return navigator.platform.indexOf("iPhone") != -1 || navigator.platform.indexOf("iPod") != -1;
}
function isiPad() {
  return navigator.platform.indexOf("iPad") != -1;
}
if (isiPhone()) {
  $('body').addClass('iphone');
}
if (isiPad()) {
  $('body').addClass('ipad');
}
;'use strict';

//Activate Skrollr
if ($('body').hasClass('home')) {
  var s = skrollr.init();
}

window.onload = function () {
  var s = skrollr.init();
  if (s.isMobile()) {
    s.destroy();
  }
  if (isiPad()) {
    s.destroy(); // skrollr.init() returns the singleton created above
  }
  var currentSize = Foundation.MediaQuery.current;
  if (Foundation.MediaQuery.current == "small") {
    s.destroy(); // skrollr.init() returns the singleton created above
  }
};

$(window).on('changed.zf.mediaquery', function (event, newSize, oldSize) {
  if (isiPad()) {} else {
    if (Foundation.MediaQuery.atLeast('medium')) {
      $('.parallax-bg').css({ "opacity": "1" });
      $('.main-content').removeClass('animate-in');
      skrollr.init(); // skrollr.init() returns the singleton created above
    } else {
        skrollr.init().destroy(); // skrollr.init() returns the singleton created above
        $('.parallax-bg').css({ "opacity": "1" });
      }
  }
});
;"use strict";

// CONTACT
var contact = $('#contactForm');

function getVisibleHeight() {
  var subtractHeight = $("#navBar").height() + $("#wpadminbar").height();
  var vH = $(window).height() - subtractHeight;
  return vH;
}
function setContactMargin() {
  $('#contactForm').css('marginTop', getVisibleHeight() * -1);
}

function setContactHeight() {
  $('#contactForm').height(getVisibleHeight());
}

$(function () {
  setContactHeight();
  setContactMargin();
  $(window).resize(function () {
    setContactHeight();
    setContactMargin();
  });
});

// SlideToggle Contact Form
$('a[href=#contact]').click(function () {
  setContactHeight();
  setContactMargin();
  // Set a class so we can see test the state of the form
  $('#contactForm').css('marginTop', 0);
  $('body').toggleClass("contact");
  $('.overlay').toggleClass('visible');

  // If clicked while form is hidden
  if ($('body').hasClass('contact')) {
    // Slidedown form
    $('#contactForm').addClass('contact-reveal');
    $('#closeForm').addClass('visible');
  } else {
    setContactMargin();
    $('#closeForm').removeClass('visible');
    $('#contactForm').removeClass('contact-reveal');
  }

  if (!$('body').hasClass('mobile-nav')) {
    $('body').toggleClass("fixed");
  }
});

// Close Form Button
$('#closeForm').click(function () {
  setContactMargin();
  $('#closeForm').removeClass('visible');
  $('.overlay').removeClass('visible');
  $('#contactForm').removeClass('contact-reveal');
  $('body').removeClass("contact");

  if (!$('body').hasClass('mobile-nav')) {
    $('body').removeClass("fixed");
  }
});

$(window).load(function () {
  $('.hs-input').each(function () {
    var input = $(this);
    var is_valid = input.val();
    $('select').parent().siblings('label').addClass("float");
    if (is_valid) {
      input.removeClass("invalid").addClass("valid");
      input.parent().siblings('label').addClass("float");
    } else {
      input.removeClass("valid").addClass("invalid");
      input.parent().siblings('label').removeClass("float");
    }
  });
  $('.hs-input').on('input', function () {
    var input = $(this);
    var is_valid = input.val();
    if (is_valid) {
      input.removeClass("invalid").addClass("valid");
      input.parent().siblings('label').addClass("float");
    } else {
      input.removeClass("valid").addClass("invalid");
      input.parent().siblings('label').removeClass("float");
    }
  });
});
;'use strict';

jQuery('iframe[src*="youtube.com"]').wrap("<div class='flex-video widescreen'/>");
jQuery('iframe[src*="vimeo.com"]').wrap("<div class='flex-video widescreen vimeo'/>");
;'use strict';

$(function () {
  if (Foundation.MediaQuery.atLeast('medium')) {
    if (isiPad()) {
      $('.headline').addClass('relative');
      $('.headline').parent().css("padding-top", "0!important");
    } else {
      $('.headline').parent().css("padding-top", "140px");
    }
  } else {
    $('.headline').parent().css("padding-top", "0");
  }
});

if (!isiPad()) {
  $(window).on('changed.zf.mediaquery', function (event, newSize, oldSize) {
    if (Foundation.MediaQuery.atLeast('medium')) {
      $('.headline').parent().css("padding-top", "140px");
    } else {
      $('.headline').parent().css("padding-top", "0");
    }
  });
}
;"use strict";

jQuery(document).foundation();
;'use strict';

// Joyride demo
$('#start-jr').on('click', function () {
  $(document).foundation('joyride', 'start');
});
;'use strict';

// Sequential nav color fade in
$('.desktop-menu li').each(function (index, element) {
  $(element).delay(index * 300).queue(function () {
    $(this).addClass('colorize');
  });
});

// wait for images
var hero = $("#featured-hero");
if (hero.length) {
  $("#featured-hero").waitForImages(function () {
    setTimeout(function () {
      $("#featured-hero").addClass("animate-in");
      $('.overlay').removeClass('load');
    }, 500);
    setTimeout(function () {
      $('.main-content').addClass('animate-in').css({ "transform": "translate(0px,0px)" });
      $('.present').addClass('animate-in').css({ "transform": "translate(0px,0px)" });
      $('.parallax-bg').addClass('animate-in').css({ "opacity": "1" });
    }, 1000);
  });
} else {
  setTimeout(function () {
    $("#featured-hero").addClass("animate-in");
    $('.overlay').removeClass('load');
    $('.main-content').addClass('animate-in').css({ "transform": "translate(0px,0px)" });
    $('.present').addClass('animate-in').css({ "transform": "translate(0px,0px)" });
    $('.parallax-bg').addClass('animate-in').css({ "opacity": "1" });
  }, 300);
}

// Logo fade in
setTimeout(function () {
  $('.home-link').addClass('colorize');
}, 300);

setTimeout(function () {
  $('.main-content').removeClass('animate-in');
  $('.parallax-bg').removeClass('animate-in');
}, 3000);

// Present
;"use strict";

// Some jquery to add some styling to the markdown parsed html on showcase pages

// Find imgs in a paragraph tag and wrap them in a row
$("#contentBody p").has("img").wrap('<div class="row expanded collapse flex-wrap" />');
$(".flex-wrap p").has("img").contents().unwrap();

// Find videos we want to put into a column
// iframes are placed in p tags, so let's look there
$("#contentBody p").has("iframe").each(function () {
  // For each p with a video we find we need to wrap it with a .video-column
  $(this).wrap("<div class='columns video-column' />");
  // Now we need to unwrap the p
  $(".video-column p").each(function () {
    $(this).has("iframe").contents().unwrap();
  });
  // If the previous element is an h6 we prepend it to look like a caption
  $(".video-column").each(function () {
    $(this).prev('h6').prependTo($(this));
  });
});

// Let's wrap wistia divs
// They aren't in P tags, so it's a bit easier.
$(".wistia_responsive_padding").wrap("<div class='columns video-column' />");

// Now we wrap it with a new selector, this helps us shift things around
$('.video-column').wrap("<div class='video-selector' />");

// For each .video-selector we're going to go next until the next element is not a video-selector
// So we basically grab all the immediate video siblings
$('.video-selector').each(function () {
  $(this).nextUntil(":not(.video-selector)").appendTo($(this)).contents().unwrap();
});
// We wrap all the siblings in one row
$(".video-selector").wrap('<div class="row expanded collapse flex-wrap" />');
// And then ditch the .video-selector element
$(".video-selector").has(".video-column").contents().unwrap();

var rowWrap = '<div class="row align-center content"><div class="small-12 columns content-col"></div></div>';
var firstChild = $('#contentBody').children().first();

firstChild.not(".flex-wrap").nextUntil('.flex-wrap').andSelf().wrapAll(rowWrap);

$(".flex-wrap").each(function (i) {
  $(this).nextUntil('.flex-wrap').wrapAll(rowWrap);
  // if img is in an anchor tag wrap the anchor tag in column
  $(this).has("a").find("a").wrap("<div class='columns'></div>");
  // if img is in flex-wrap wrap in column
  $(this).has("img").find("img").wrap("<div class='columns'></div>");

  // Cleaning up some possibilities
  $(this).has("a").find("a .columns").contents().unwrap();
  $(this).has("br").find("br").remove();
});

// IMG Captions
$(".columns img").each(function () {
  var imageCaption = $(this).attr("alt");
  if (imageCaption) {
    $("<h6>" + imageCaption + "</h6>").insertBefore(this);
  }
});

// GIF loading
$(function () {
  // $('img[src$=".gif"]').each(function() {
  //   var src = $(this).attr("src");
  //   $(this).attr("src", src.replace(/\.gif$/i, ".jpg"));
  //   $(this).addClass("gif");
  // });
  $('.gif').hover(function () {
    var src = $(this).attr("src");
    $(this).attr("src", src.replace(/\.jpg$/i, ".gif"));
  }, function () {
    var src = $(this).attr("src");
    $(this).attr("src", src.replace(/\.gif$/i, ".jpg"));
  });
});
;"use strict";

$('#mobileMenu').hide();
function getVisibleHeightNav() {
  var subtractHeight = $("#navBar").height() + $("#wpadminbar").height() + $("#mobileBoxButton").height();
  var vH = $(window).height() - subtractHeight;
  return vH;
}

function setMobileNavHeight() {
  $('#mobileMenu').height(getVisibleHeightNav());
}

$(function () {
  setMobileNavHeight();
  $(window).resize(function () {
    setMobileNavHeight();
  });
});

// SlideToggle Mobile Nav Form
$('#mobileToggle').click(function () {
  $(this).toggleClass('open');
  $('#mobileMenu').slideToggle("slow", function () {});
  $('body').toggleClass("fixed mobile-nav");
  $('#mobileMenu li').each(function (index, element) {
    $(element).delay(index * 150).queue(function () {
      $(this).addClass('fade-in');
    });
  });
  if ($('body').hasClass('contact')) {
    setContactMargin();
    $('#closeForm').removeClass('visible');
    $('#contactForm').removeClass('contact-reveal');
    $('.overlay').removeClass('visible');
    $('body').removeClass('contact');
  }
});

$(window).on('changed.zf.mediaquery', function (event, newSize, oldSize) {
  if (newSize == "medium") {
    if (oldSize == "small") {
      $('#mobileMenu').slideUp();
      if ($('body').hasClass("mobile-nav")) {
        $(this).removeClass("fixed mobile-nav");
      }
    }
  }

  if (oldSize == "medium") {
    if (newSize == "small") {
      $('.sticky-container').css('height', 'auto');
    }
  }
});
;"use strict";

// Mobile Nav
var lastScrollTop = 0;
$(window).scroll(function (event) {
  var st = $(this).scrollTop();

  if (st > lastScrollTop) {
    if (st > 150) {
      $("#navigationContainer").addClass('peek-hide');
    }
  } else {
    var offset = lastScrollTop - st;
    if (offset > 2) {
      console.log(offset);
      $("#navigationContainer").removeClass('peek-hide');
      $("#navigationContainer").addClass('peek');
    }
  }
  lastScrollTop = st;
});
;'use strict';

$('.hover-indicator').each(function () {
    var width = $(this).next().children("h3").width();
    $(this).width(width + 40);
});
$(window).resize(function () {
    $('.hover-indicator').each(function () {
        var width = $(this).next().children("h3").width();
        $(this).width(width + 40);
    });
});
$(".permalink").hover(function () {
    $(this).find('.hover-indicator').toggleClass("hover");
});
;'use strict';

$(window).bind(' load resize orientationChange ', function () {
  var footer = $("#footer-container");
  var pos = footer.position();
  var height = $(window).height();
  height = height - pos.top;
  height = height - footer.height() - 1;

  function stickyFooter() {
    footer.css({
      'margin-top': height + 'px'
    });
  }

  if (height > 0) {
    stickyFooter();
  }
});
;"use strict";

$("#featureVideo").fadeOut();

// Playback for Archive Page
function archivePlay(perma) {
  $("body").addClass("video-fixed");
  $("#featured-hero").addClass('video-reveal').removeClass('hidden');
  $("#featured-hero").addClass("click-to-close");
  $(".feature-overlay").addClass("animate-in");
  $('#navBar').addClass('push-up');
  $('.main-content').addClass('push-down');
  $('.feature-play').fadeOut();

  $('#seeProject').attr("href", perma);

  setTimeout(function () {
    $("#featureVideo").fadeIn('slow');
  }, 500);

  return false;
}

$(".play").click(function () {

  if ($(this).hasClass('reel')) {
    $('#seeProject').parent().hide();
  } else {
    $('#seeProject').parent().show();
  }
  var permalink = $(this).attr("data-permalink");
  archivePlay(permalink);
});

if (isiPad() || isiPhone()) {
  $('#featured-hero').addClass('device');

  $(".iplay").bind("touchstart click", function () {
    var permalink = $(this).closest('a').attr("data-permalink");
    archivePlay(permalink);
  });
}

//Playback for Single Page
$(".feature-play").click(function () {

  $("body").addClass("video-fixed video-single");
  $("#featured-hero").addClass("video-reveal click-to-close");
  $(".feature-overlay").addClass("animate-in");
  $("#featureVideo").fadeIn('slow');
  $('#navBar').addClass('push-up');
  $('.feature-play').addClass('blow-up');
  $('.main-content').addClass('push-down');
});

$(document).mouseup(function (e) {
  var container = $(".wistia_embed");

  if ($('body').hasClass('video-fixed')) {
    if (!container.is(e.target) && container.has(e.target).length === 0) {
      $("body").removeClass("video-fixed");
      $("#featureVideo").hide();

      if ($('body').hasClass('video-single')) {
        $("#featured-hero").removeClass("video-reveal click-to-close");
        $(".feature-overlay").removeClass("animate-in");
        $('#navBar').removeClass('push-up');
        $('.feature-play').removeClass('blow-up');
        $('.main-content').removeClass('push-down');
      } else if ($('body').hasClass('single-example')) {
        $("#featured-hero").removeClass("video-reveal click-to-close");
        $(".feature-overlay").removeClass("animate-in");
        $('#navBar').removeClass('push-up');
        $('.feature-play').removeClass('blow-up');
        $('.main-content').removeClass('push-down');
      } else {
        $("#featured-hero").removeClass('video-reveal').addClass('hidden');
        $(".feature-overlay").removeClass("animate-in");
        $('#navBar').removeClass('push-up');
        $('.main-content').removeClass('push-down');
      }
    }
  }
});

$(".permalink").hover(function () {
  $(this).siblings(".post-block").find(".permalink-overlay").toggleClass("show");
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndoYXQtaW5wdXQuanMiLCJmb3VuZGF0aW9uLmNvcmUuanMiLCJmb3VuZGF0aW9uLnV0aWwuYm94LmpzIiwiZm91bmRhdGlvbi51dGlsLmtleWJvYXJkLmpzIiwiZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnkuanMiLCJmb3VuZGF0aW9uLnV0aWwubW90aW9uLmpzIiwiZm91bmRhdGlvbi51dGlsLm5lc3QuanMiLCJmb3VuZGF0aW9uLnV0aWwudGltZXJBbmRJbWFnZUxvYWRlci5qcyIsImZvdW5kYXRpb24udXRpbC50b3VjaC5qcyIsImZvdW5kYXRpb24udXRpbC50cmlnZ2Vycy5qcyIsImZvdW5kYXRpb24uYWJpZGUuanMiLCJmb3VuZGF0aW9uLmFjY29yZGlvbi5qcyIsImZvdW5kYXRpb24uYWNjb3JkaW9uTWVudS5qcyIsImZvdW5kYXRpb24uZHJpbGxkb3duLmpzIiwiZm91bmRhdGlvbi5kcm9wZG93bi5qcyIsImZvdW5kYXRpb24uZHJvcGRvd25NZW51LmpzIiwiZm91bmRhdGlvbi5lcXVhbGl6ZXIuanMiLCJmb3VuZGF0aW9uLmludGVyY2hhbmdlLmpzIiwiZm91bmRhdGlvbi5tYWdlbGxhbi5qcyIsImZvdW5kYXRpb24ub2ZmY2FudmFzLmpzIiwiZm91bmRhdGlvbi5vcmJpdC5qcyIsImZvdW5kYXRpb24ucmVzcG9uc2l2ZU1lbnUuanMiLCJmb3VuZGF0aW9uLnJlc3BvbnNpdmVUb2dnbGUuanMiLCJmb3VuZGF0aW9uLnJldmVhbC5qcyIsImZvdW5kYXRpb24uc2xpZGVyLmpzIiwiZm91bmRhdGlvbi5zdGlja3kuanMiLCJmb3VuZGF0aW9uLnRhYnMuanMiLCJmb3VuZGF0aW9uLnRvZ2dsZXIuanMiLCJmb3VuZGF0aW9uLnRvb2x0aXAuanMiLCJtb3Rpb24tdWkuanMiLCJza3JvbGxyLm1pbi5qcyIsIl9pc0RldmljZS5qcyIsIl9za3JvbGxyLmpzIiwiY29udGFjdC5qcyIsImZsZXgtdmlkZW8uanMiLCJoZWFkbGluZS5qcyIsImluaXQtZm91bmRhdGlvbi5qcyIsImpveXJpZGUtZGVtby5qcyIsImxvYWRiYXIuanMiLCJtYXJrZG93bi1mb3JtYXQuanMiLCJtb2JpbGUtbmF2LmpzIiwibmF2LXBlZWsuanMiLCJwb3N0cy5qcyIsInN0aWNreWZvb3Rlci5qcyIsIndvcmsuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxPQUFPLFNBQVAsR0FBb0IsWUFBVzs7QUFFN0I7Ozs7Ozs7Ozs7QUFTQSxNQUFJLGFBQWEsRUFBakI7OztBQUdBLE1BQUksSUFBSjs7O0FBR0EsTUFBSSxTQUFTLEtBQWI7OztBQUdBLE1BQUksZUFBZSxJQUFuQjs7O0FBR0EsTUFBSSxrQkFBa0IsQ0FDcEIsUUFEb0IsRUFFcEIsVUFGb0IsRUFHcEIsTUFIb0IsRUFJcEIsT0FKb0IsRUFLcEIsT0FMb0IsRUFNcEIsT0FOb0IsRUFPcEIsUUFQb0IsQ0FBdEI7Ozs7QUFZQSxNQUFJLGFBQWEsYUFBakI7Ozs7QUFJQSxNQUFJLFlBQVksQ0FDZCxFQURjO0FBRWQsSUFGYztBQUdkLElBSGM7QUFJZCxJQUpjO0FBS2Q7QUFMYyxHQUFoQjs7O0FBU0EsTUFBSSxXQUFXO0FBQ2IsZUFBVyxVQURFO0FBRWIsYUFBUyxVQUZJO0FBR2IsaUJBQWEsT0FIQTtBQUliLGlCQUFhLE9BSkE7QUFLYixxQkFBaUIsU0FMSjtBQU1iLHFCQUFpQixTQU5KO0FBT2IsbUJBQWUsU0FQRjtBQVFiLG1CQUFlLFNBUkY7QUFTYixrQkFBYztBQVRELEdBQWY7OztBQWFBLFdBQVMsYUFBVCxJQUEwQixPQUExQjs7O0FBR0EsTUFBSSxhQUFhLEVBQWpCOzs7QUFHQSxNQUFJLFNBQVM7QUFDWCxPQUFHLEtBRFE7QUFFWCxRQUFJLE9BRk87QUFHWCxRQUFJLE9BSE87QUFJWCxRQUFJLEtBSk87QUFLWCxRQUFJLE9BTE87QUFNWCxRQUFJLE1BTk87QUFPWCxRQUFJLElBUE87QUFRWCxRQUFJLE9BUk87QUFTWCxRQUFJO0FBVE8sR0FBYjs7O0FBYUEsTUFBSSxhQUFhO0FBQ2YsT0FBRyxPQURZO0FB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PSAoZnVuY3Rpb24oKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICAgdmFyaWFibGVzXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICovXG5cbiAgLy8gYXJyYXkgb2YgYWN0aXZlbHkgcHJlc3NlZCBrZXlzXG4gIHZhciBhY3RpdmVLZXlzID0gW107XG5cbiAgLy8gY2FjaGUgZG9jdW1lbnQuYm9keVxuICB2YXIgYm9keTtcblxuICAvLyBib29sZWFuOiB0cnVlIGlmIHRvdWNoIGJ1ZmZlciB0aW1lciBpcyBydW5uaW5nXG4gIHZhciBidWZmZXIgPSBmYWxzZTtcblxuICAvLyB0aGUgbGFzdCB1c2VkIGlucHV0IHR5cGVcbiAgdmFyIGN1cnJlbnRJbnB1dCA9IG51bGw7XG5cbiAgLy8gYGlucHV0YCB0eXBlcyB0aGF0IGRvbid0IGFjY2VwdCB0ZXh0XG4gIHZhciBub25UeXBpbmdJbnB1dHMgPSBbXG4gICAgJ2J1dHRvbicsXG4gICAgJ2NoZWNrYm94JyxcbiAgICAnZmlsZScsXG4gICAgJ2ltYWdlJyxcbiAgICAncmFkaW8nLFxuICAgICdyZXNldCcsXG4gICAgJ3N1Ym1pdCdcbiAgXTtcblxuICAvLyBkZXRlY3QgdmVyc2lvbiBvZiBtb3VzZSB3aGVlbCBldmVudCB0byB1c2VcbiAgLy8gdmlhIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0V2ZW50cy93aGVlbFxuICB2YXIgbW91c2VXaGVlbCA9IGRldGVjdFdoZWVsKCk7XG5cbiAgLy8gbGlzdCBvZiBtb2RpZmllciBrZXlzIGNvbW1vbmx5IHVzZWQgd2l0aCB0aGUgbW91c2UgYW5kXG4gIC8vIGNhbiBiZSBzYWZlbHkgaWdub3JlZCB0byBwcmV2ZW50IGZhbHNlIGtleWJvYXJkIGRldGVjdGlvblxuICB2YXIgaWdub3JlTWFwID0gW1xuICAgIDE2LCAvLyBzaGlmdFxuICAgIDE3LCAvLyBjb250cm9sXG4gICAgMTgsIC8vIGFsdFxuICAgIDkxLCAvLyBXaW5kb3dzIGtleSAvIGxlZnQgQXBwbGUgY21kXG4gICAgOTMgIC8vIFdpbmRvd3MgbWVudSAvIHJpZ2h0IEFwcGxlIGNtZFxuICBdO1xuXG4gIC8vIG1hcHBpbmcgb2YgZXZlbnRzIHRvIGlucHV0IHR5cGVzXG4gIHZhciBpbnB1dE1hcCA9IHtcbiAgICAna2V5ZG93bic6ICdrZXlib2FyZCcsXG4gICAgJ2tleXVwJzogJ2tleWJvYXJkJyxcbiAgICAnbW91c2Vkb3duJzogJ21vdXNlJyxcbiAgICAnbW91c2Vtb3ZlJzogJ21vdXNlJyxcbiAgICAnTVNQb2ludGVyRG93bic6ICdwb2ludGVyJyxcbiAgICAnTVNQb2ludGVyTW92ZSc6ICdwb2ludGVyJyxcbiAgICAncG9pbnRlcmRvd24nOiAncG9pbnRlcicsXG4gICAgJ3BvaW50ZXJtb3ZlJzogJ3BvaW50ZXInLFxuICAgICd0b3VjaHN0YXJ0JzogJ3RvdWNoJ1xuICB9O1xuXG4gIC8vIGFkZCBjb3JyZWN0IG1vdXNlIHdoZWVsIGV2ZW50IG1hcHBpbmcgdG8gYGlucHV0TWFwYFxuICBpbnB1dE1hcFtkZXRlY3RXaGVlbCgpXSA9ICdtb3VzZSc7XG5cbiAgLy8gYXJyYXkgb2YgYWxsIHVzZWQgaW5wdXQgdHlwZXNcbiAgdmFyIGlucHV0VHlwZXMgPSBbXTtcblxuICAvLyBtYXBwaW5nIG9mIGtleSBjb2RlcyB0byBhIGNvbW1vbiBuYW1lXG4gIHZhciBrZXlNYXAgPSB7XG4gICAgOTogJ3RhYicsXG4gICAgMTM6ICdlbnRlcicsXG4gICAgMTY6ICdzaGlmdCcsXG4gICAgMjc6ICdlc2MnLFxuICAgIDMyOiAnc3BhY2UnLFxuICAgIDM3OiAnbGVmdCcsXG4gICAgMzg6ICd1cCcsXG4gICAgMzk6ICdyaWdodCcsXG4gICAgNDA6ICdkb3duJ1xuICB9O1xuXG4gIC8vIG1hcCBvZiBJRSAxMCBwb2ludGVyIGV2ZW50c1xuICB2YXIgcG9pbnRlck1hcCA9IHtcbiAgICAyOiAndG91Y2gnLFxuICAgIDM6ICd0b3VjaCcsIC8vIHRyZWF0IHBlbiBsaWtlIHRvdWNoXG4gICAgNDogJ21vdXNlJ1xuICB9O1xuXG4gIC8vIHRvdWNoIGJ1ZmZlciB0aW1lclxuICB2YXIgdGltZXI7XG5cblxuICAvKlxuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAgIGZ1bmN0aW9uc1xuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAqL1xuXG4gIC8vIGFsbG93cyBldmVudHMgdGhhdCBhcmUgYWxzbyB0cmlnZ2VyZWQgdG8gYmUgZmlsdGVyZWQgb3V0IGZvciBgdG91Y2hzdGFydGBcbiAgZnVuY3Rpb24gZXZlbnRCdWZmZXIoKSB7XG4gICAgY2xlYXJUaW1lcigpO1xuICAgIHNldElucHV0KGV2ZW50KTtcblxuICAgIGJ1ZmZlciA9IHRydWU7XG4gICAgdGltZXIgPSB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIGJ1ZmZlciA9IGZhbHNlO1xuICAgIH0sIDY1MCk7XG4gIH1cblxuICBmdW5jdGlvbiBidWZmZXJlZEV2ZW50KGV2ZW50KSB7XG4gICAgaWYgKCFidWZmZXIpIHNldElucHV0KGV2ZW50KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVuQnVmZmVyZWRFdmVudChldmVudCkge1xuICAgIGNsZWFyVGltZXIoKTtcbiAgICBzZXRJbnB1dChldmVudCk7XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhclRpbWVyKCkge1xuICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGltZXIpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0SW5wdXQoZXZlbnQpIHtcbiAgICB2YXIgZXZlbnRLZXkgPSBrZXkoZXZlbnQpO1xuICAgIHZhciB2YWx1ZSA9IGlucHV0TWFwW2V2ZW50LnR5cGVdO1xuICAgIGlmICh2YWx1ZSA9PT0gJ3BvaW50ZXInKSB2YWx1ZSA9IHBvaW50ZXJUeXBlKGV2ZW50KTtcblxuICAgIC8vIGRvbid0IGRvIGFueXRoaW5nIGlmIHRoZSB2YWx1ZSBtYXRjaGVzIHRoZSBpbnB1dCB0eXBlIGFscmVhZHkgc2V0XG4gICAgaWYgKGN1cnJlbnRJbnB1dCAhPT0gdmFsdWUpIHtcbiAgICAgIHZhciBldmVudFRhcmdldCA9IHRhcmdldChldmVudCk7XG4gICAgICB2YXIgZXZlbnRUYXJnZXROb2RlID0gZXZlbnRUYXJnZXQubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgIHZhciBldmVudFRhcmdldFR5cGUgPSAoZXZlbnRUYXJnZXROb2RlID09PSAnaW5wdXQnKSA/IGV2ZW50VGFyZ2V0LmdldEF0dHJpYnV0ZSgndHlwZScpIDogbnVsbDtcblxuICAgICAgaWYgKFxuICAgICAgICAoLy8gb25seSBpZiB0aGUgdXNlciBmbGFnIHRvIGFsbG93IHR5cGluZyBpbiBmb3JtIGZpZWxkcyBpc24ndCBzZXRcbiAgICAgICAgIWJvZHkuaGFzQXR0cmlidXRlKCdkYXRhLXdoYXRpbnB1dC1mb3JtdHlwaW5nJykgJiZcblxuICAgICAgICAvLyBvbmx5IGlmIGN1cnJlbnRJbnB1dCBoYXMgYSB2YWx1ZVxuICAgICAgICBjdXJyZW50SW5wdXQgJiZcblxuICAgICAgICAvLyBvbmx5IGlmIHRoZSBpbnB1dCBpcyBga2V5Ym9hcmRgXG4gICAgICAgIHZhbHVlID09PSAna2V5Ym9hcmQnICYmXG5cbiAgICAgICAgLy8gbm90IGlmIHRoZSBrZXkgaXMgYFRBQmBcbiAgICAgICAga2V5TWFwW2V2ZW50S2V5XSAhPT0gJ3RhYicgJiZcblxuICAgICAgICAvLyBvbmx5IGlmIHRoZSB0YXJnZXQgaXMgYSBmb3JtIGlucHV0IHRoYXQgYWNjZXB0cyB0ZXh0XG4gICAgICAgIChcbiAgICAgICAgICAgZXZlbnRUYXJnZXROb2RlID09PSAndGV4dGFyZWEnIHx8XG4gICAgICAgICAgIGV2ZW50VGFyZ2V0Tm9kZSA9PT0gJ3NlbGVjdCcgfHxcbiAgICAgICAgICAgKGV2ZW50VGFyZ2V0Tm9kZSA9PT0gJ2lucHV0JyAmJiBub25UeXBpbmdJbnB1dHMuaW5kZXhPZihldmVudFRhcmdldFR5cGUpIDwgMClcbiAgICAgICAgKSkgfHwgKFxuICAgICAgICAgIC8vIGlnbm9yZSBtb2RpZmllciBrZXlzXG4gICAgICAgICAgaWdub3JlTWFwLmluZGV4T2YoZXZlbnRLZXkpID4gLTFcbiAgICAgICAgKVxuICAgICAgKSB7XG4gICAgICAgIC8vIGlnbm9yZSBrZXlib2FyZCB0eXBpbmdcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN3aXRjaElucHV0KHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodmFsdWUgPT09ICdrZXlib2FyZCcpIGxvZ0tleXMoZXZlbnRLZXkpO1xuICB9XG5cbiAgZnVuY3Rpb24gc3dpdGNoSW5wdXQoc3RyaW5nKSB7XG4gICAgY3VycmVudElucHV0ID0gc3RyaW5nO1xuICAgIGJvZHkuc2V0QXR0cmlidXRlKCdkYXRhLXdoYXRpbnB1dCcsIGN1cnJlbnRJbnB1dCk7XG5cbiAgICBpZiAoaW5wdXRUeXBlcy5pbmRleE9mKGN1cnJlbnRJbnB1dCkgPT09IC0xKSBpbnB1dFR5cGVzLnB1c2goY3VycmVudElucHV0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGtleShldmVudCkge1xuICAgIHJldHVybiAoZXZlbnQua2V5Q29kZSkgPyBldmVudC5rZXlDb2RlIDogZXZlbnQud2hpY2g7XG4gIH1cblxuICBmdW5jdGlvbiB0YXJnZXQoZXZlbnQpIHtcbiAgICByZXR1cm4gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LnNyY0VsZW1lbnQ7XG4gIH1cblxuICBmdW5jdGlvbiBwb2ludGVyVHlwZShldmVudCkge1xuICAgIGlmICh0eXBlb2YgZXZlbnQucG9pbnRlclR5cGUgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gcG9pbnRlck1hcFtldmVudC5wb2ludGVyVHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAoZXZlbnQucG9pbnRlclR5cGUgPT09ICdwZW4nKSA/ICd0b3VjaCcgOiBldmVudC5wb2ludGVyVHlwZTsgLy8gdHJlYXQgcGVuIGxpa2UgdG91Y2hcbiAgICB9XG4gIH1cblxuICAvLyBrZXlib2FyZCBsb2dnaW5nXG4gIGZ1bmN0aW9uIGxvZ0tleXMoZXZlbnRLZXkpIHtcbiAgICBpZiAoYWN0aXZlS2V5cy5pbmRleE9mKGtleU1hcFtldmVudEtleV0pID09PSAtMSAmJiBrZXlNYXBbZXZlbnRLZXldKSBhY3RpdmVLZXlzLnB1c2goa2V5TWFwW2V2ZW50S2V5XSk7XG4gIH1cblxuICBmdW5jdGlvbiB1bkxvZ0tleXMoZXZlbnQpIHtcbiAgICB2YXIgZXZlbnRLZXkgPSBrZXkoZXZlbnQpO1xuICAgIHZhciBhcnJheVBvcyA9IGFjdGl2ZUtleXMuaW5kZXhPZihrZXlNYXBbZXZlbnRLZXldKTtcblxuICAgIGlmIChhcnJheVBvcyAhPT0gLTEpIGFjdGl2ZUtleXMuc3BsaWNlKGFycmF5UG9zLCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJpbmRFdmVudHMoKSB7XG4gICAgYm9keSA9IGRvY3VtZW50LmJvZHk7XG5cbiAgICAvLyBwb2ludGVyIGV2ZW50cyAobW91c2UsIHBlbiwgdG91Y2gpXG4gICAgaWYgKHdpbmRvdy5Qb2ludGVyRXZlbnQpIHtcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCBidWZmZXJlZEV2ZW50KTtcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCBidWZmZXJlZEV2ZW50KTtcbiAgICB9IGVsc2UgaWYgKHdpbmRvdy5NU1BvaW50ZXJFdmVudCkge1xuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJEb3duJywgYnVmZmVyZWRFdmVudCk7XG4gICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlck1vdmUnLCBidWZmZXJlZEV2ZW50KTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICAvLyBtb3VzZSBldmVudHNcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgYnVmZmVyZWRFdmVudCk7XG4gICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGJ1ZmZlcmVkRXZlbnQpO1xuXG4gICAgICAvLyB0b3VjaCBldmVudHNcbiAgICAgIGlmICgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpIHtcbiAgICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgZXZlbnRCdWZmZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIG1vdXNlIHdoZWVsXG4gICAgYm9keS5hZGRFdmVudExpc3RlbmVyKG1vdXNlV2hlZWwsIGJ1ZmZlcmVkRXZlbnQpO1xuXG4gICAgLy8ga2V5Ym9hcmQgZXZlbnRzXG4gICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdW5CdWZmZXJlZEV2ZW50KTtcbiAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdW5CdWZmZXJlZEV2ZW50KTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHVuTG9nS2V5cyk7XG4gIH1cblxuXG4gIC8qXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICAgdXRpbGl0aWVzXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICovXG5cbiAgLy8gZGV0ZWN0IHZlcnNpb24gb2YgbW91c2Ugd2hlZWwgZXZlbnQgdG8gdXNlXG4gIC8vIHZpYSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9FdmVudHMvd2hlZWxcbiAgZnVuY3Rpb24gZGV0ZWN0V2hlZWwoKSB7XG4gICAgcmV0dXJuIG1vdXNlV2hlZWwgPSAnb253aGVlbCcgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykgP1xuICAgICAgJ3doZWVsJyA6IC8vIE1vZGVybiBicm93c2VycyBzdXBwb3J0IFwid2hlZWxcIlxuXG4gICAgICBkb2N1bWVudC5vbm1vdXNld2hlZWwgIT09IHVuZGVmaW5lZCA/XG4gICAgICAgICdtb3VzZXdoZWVsJyA6IC8vIFdlYmtpdCBhbmQgSUUgc3VwcG9ydCBhdCBsZWFzdCBcIm1vdXNld2hlZWxcIlxuICAgICAgICAnRE9NTW91c2VTY3JvbGwnOyAvLyBsZXQncyBhc3N1bWUgdGhhdCByZW1haW5pbmcgYnJvd3NlcnMgYXJlIG9sZGVyIEZpcmVmb3hcbiAgfVxuXG5cbiAgLypcbiAgICAtLS0tLS0tLS0tLS0tLS1cbiAgICBpbml0XG5cbiAgICBkb24ndCBzdGFydCBzY3JpcHQgdW5sZXNzIGJyb3dzZXIgY3V0cyB0aGUgbXVzdGFyZCxcbiAgICBhbHNvIHBhc3NlcyBpZiBwb2x5ZmlsbHMgYXJlIHVzZWRcbiAgICAtLS0tLS0tLS0tLS0tLS1cbiAgKi9cblxuICBpZiAoXG4gICAgJ2FkZEV2ZW50TGlzdGVuZXInIGluIHdpbmRvdyAmJlxuICAgIEFycmF5LnByb3RvdHlwZS5pbmRleE9mXG4gICkge1xuXG4gICAgLy8gaWYgdGhlIGRvbSBpcyBhbHJlYWR5IHJlYWR5IGFscmVhZHkgKHNjcmlwdCB3YXMgcGxhY2VkIGF0IGJvdHRvbSBvZiA8Ym9keT4pXG4gICAgaWYgKGRvY3VtZW50LmJvZHkpIHtcbiAgICAgIGJpbmRFdmVudHMoKTtcblxuICAgIC8vIG90aGVyd2lzZSB3YWl0IGZvciB0aGUgZG9tIHRvIGxvYWQgKHNjcmlwdCB3YXMgcGxhY2VkIGluIHRoZSA8aGVhZD4pXG4gICAgfSBlbHNlIHtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBiaW5kRXZlbnRzKTtcbiAgICB9XG4gIH1cblxuXG4gIC8qXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICAgYXBpXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICovXG5cbiAgcmV0dXJuIHtcblxuICAgIC8vIHJldHVybnMgc3RyaW5nOiB0aGUgY3VycmVudCBpbnB1dCB0eXBlXG4gICAgYXNrOiBmdW5jdGlvbigpIHsgcmV0dXJuIGN1cnJlbnRJbnB1dDsgfSxcblxuICAgIC8vIHJldHVybnMgYXJyYXk6IGN1cnJlbnRseSBwcmVzc2VkIGtleXNcbiAgICBrZXlzOiBmdW5jdGlvbigpIHsgcmV0dXJuIGFjdGl2ZUtleXM7IH0sXG5cbiAgICAvLyByZXR1cm5zIGFycmF5OiBhbGwgdGhlIGRldGVjdGVkIGlucHV0IHR5cGVzXG4gICAgdHlwZXM6IGZ1bmN0aW9uKCkgeyByZXR1cm4gaW5wdXRUeXBlczsgfSxcblxuICAgIC8vIGFjY2VwdHMgc3RyaW5nOiBtYW51YWxseSBzZXQgdGhlIGlucHV0IHR5cGVcbiAgICBzZXQ6IHN3aXRjaElucHV0XG4gIH07XG5cbn0oKSk7XG4iLCIhZnVuY3Rpb24oJCkge1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIEZPVU5EQVRJT05fVkVSU0lPTiA9ICc2LjIuMSc7XG5cbi8vIEdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxuLy8gVGhpcyBpcyBhdHRhY2hlZCB0byB0aGUgd2luZG93LCBvciB1c2VkIGFzIGEgbW9kdWxlIGZvciBBTUQvQnJvd3NlcmlmeVxudmFyIEZvdW5kYXRpb24gPSB7XG4gIHZlcnNpb246IEZPVU5EQVRJT05fVkVSU0lPTixcblxuICAvKipcbiAgICogU3RvcmVzIGluaXRpYWxpemVkIHBsdWdpbnMuXG4gICAqL1xuICBfcGx1Z2luczoge30sXG5cbiAgLyoqXG4gICAqIFN0b3JlcyBnZW5lcmF0ZWQgdW5pcXVlIGlkcyBmb3IgcGx1Z2luIGluc3RhbmNlc1xuICAgKi9cbiAgX3V1aWRzOiBbXSxcblxuICAvKipcbiAgICogUmV0dXJucyBhIGJvb2xlYW4gZm9yIFJUTCBzdXBwb3J0XG4gICAqL1xuICBydGw6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuICQoJ2h0bWwnKS5hdHRyKCdkaXInKSA9PT0gJ3J0bCc7XG4gIH0sXG4gIC8qKlxuICAgKiBEZWZpbmVzIGEgRm91bmRhdGlvbiBwbHVnaW4sIGFkZGluZyBpdCB0byB0aGUgYEZvdW5kYXRpb25gIG5hbWVzcGFjZSBhbmQgdGhlIGxpc3Qgb2YgcGx1Z2lucyB0byBpbml0aWFsaXplIHdoZW4gcmVmbG93aW5nLlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gVGhlIGNvbnN0cnVjdG9yIG9mIHRoZSBwbHVnaW4uXG4gICAqL1xuICBwbHVnaW46IGZ1bmN0aW9uKHBsdWdpbiwgbmFtZSkge1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gYWRkaW5nIHRvIGdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxuICAgIC8vIEV4YW1wbGVzOiBGb3VuZGF0aW9uLlJldmVhbCwgRm91bmRhdGlvbi5PZmZDYW52YXNcbiAgICB2YXIgY2xhc3NOYW1lID0gKG5hbWUgfHwgZnVuY3Rpb25OYW1lKHBsdWdpbikpO1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gc3RvcmluZyB0aGUgcGx1Z2luLCBhbHNvIHVzZWQgdG8gY3JlYXRlIHRoZSBpZGVudGlmeWluZyBkYXRhIGF0dHJpYnV0ZSBmb3IgdGhlIHBsdWdpblxuICAgIC8vIEV4YW1wbGVzOiBkYXRhLXJldmVhbCwgZGF0YS1vZmYtY2FudmFzXG4gICAgdmFyIGF0dHJOYW1lICA9IGh5cGhlbmF0ZShjbGFzc05hbWUpO1xuXG4gICAgLy8gQWRkIHRvIHRoZSBGb3VuZGF0aW9uIG9iamVjdCBhbmQgdGhlIHBsdWdpbnMgbGlzdCAoZm9yIHJlZmxvd2luZylcbiAgICB0aGlzLl9wbHVnaW5zW2F0dHJOYW1lXSA9IHRoaXNbY2xhc3NOYW1lXSA9IHBsdWdpbjtcbiAgfSxcbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBQb3B1bGF0ZXMgdGhlIF91dWlkcyBhcnJheSB3aXRoIHBvaW50ZXJzIHRvIGVhY2ggaW5kaXZpZHVhbCBwbHVnaW4gaW5zdGFuY2UuXG4gICAqIEFkZHMgdGhlIGB6ZlBsdWdpbmAgZGF0YS1hdHRyaWJ1dGUgdG8gcHJvZ3JhbW1hdGljYWxseSBjcmVhdGVkIHBsdWdpbnMgdG8gYWxsb3cgdXNlIG9mICQoc2VsZWN0b3IpLmZvdW5kYXRpb24obWV0aG9kKSBjYWxscy5cbiAgICogQWxzbyBmaXJlcyB0aGUgaW5pdGlhbGl6YXRpb24gZXZlbnQgZm9yIGVhY2ggcGx1Z2luLCBjb25zb2xpZGF0aW5nIHJlcGVkaXRpdmUgY29kZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpbiAtIGFuIGluc3RhbmNlIG9mIGEgcGx1Z2luLCB1c3VhbGx5IGB0aGlzYCBpbiBjb250ZXh0LlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIHRoZSBuYW1lIG9mIHRoZSBwbHVnaW4sIHBhc3NlZCBhcyBhIGNhbWVsQ2FzZWQgc3RyaW5nLlxuICAgKiBAZmlyZXMgUGx1Z2luI2luaXRcbiAgICovXG4gIHJlZ2lzdGVyUGx1Z2luOiBmdW5jdGlvbihwbHVnaW4sIG5hbWUpe1xuICAgIHZhciBwbHVnaW5OYW1lID0gbmFtZSA/IGh5cGhlbmF0ZShuYW1lKSA6IGZ1bmN0aW9uTmFtZShwbHVnaW4uY29uc3RydWN0b3IpLnRvTG93ZXJDYXNlKCk7XG4gICAgcGx1Z2luLnV1aWQgPSB0aGlzLkdldFlvRGlnaXRzKDYsIHBsdWdpbk5hbWUpO1xuXG4gICAgaWYoIXBsdWdpbi4kZWxlbWVudC5hdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gKSl7IHBsdWdpbi4kZWxlbWVudC5hdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gLCBwbHVnaW4udXVpZCk7IH1cbiAgICBpZighcGx1Z2luLiRlbGVtZW50LmRhdGEoJ3pmUGx1Z2luJykpeyBwbHVnaW4uJGVsZW1lbnQuZGF0YSgnemZQbHVnaW4nLCBwbHVnaW4pOyB9XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBpbml0aWFsaXplZC5cbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2luaXRcbiAgICAgICAgICAgKi9cbiAgICBwbHVnaW4uJGVsZW1lbnQudHJpZ2dlcihgaW5pdC56Zi4ke3BsdWdpbk5hbWV9YCk7XG5cbiAgICB0aGlzLl91dWlkcy5wdXNoKHBsdWdpbi51dWlkKTtcblxuICAgIHJldHVybjtcbiAgfSxcbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBSZW1vdmVzIHRoZSBwbHVnaW5zIHV1aWQgZnJvbSB0aGUgX3V1aWRzIGFycmF5LlxuICAgKiBSZW1vdmVzIHRoZSB6ZlBsdWdpbiBkYXRhIGF0dHJpYnV0ZSwgYXMgd2VsbCBhcyB0aGUgZGF0YS1wbHVnaW4tbmFtZSBhdHRyaWJ1dGUuXG4gICAqIEFsc28gZmlyZXMgdGhlIGRlc3Ryb3llZCBldmVudCBmb3IgdGhlIHBsdWdpbiwgY29uc29saWRhdGluZyByZXBlZGl0aXZlIGNvZGUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwbHVnaW4gLSBhbiBpbnN0YW5jZSBvZiBhIHBsdWdpbiwgdXN1YWxseSBgdGhpc2AgaW4gY29udGV4dC5cbiAgICogQGZpcmVzIFBsdWdpbiNkZXN0cm95ZWRcbiAgICovXG4gIHVucmVnaXN0ZXJQbHVnaW46IGZ1bmN0aW9uKHBsdWdpbil7XG4gICAgdmFyIHBsdWdpbk5hbWUgPSBoeXBoZW5hdGUoZnVuY3Rpb25OYW1lKHBsdWdpbi4kZWxlbWVudC5kYXRhKCd6ZlBsdWdpbicpLmNvbnN0cnVjdG9yKSk7XG5cbiAgICB0aGlzLl91dWlkcy5zcGxpY2UodGhpcy5fdXVpZHMuaW5kZXhPZihwbHVnaW4udXVpZCksIDEpO1xuICAgIHBsdWdpbi4kZWxlbWVudC5yZW1vdmVBdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gKS5yZW1vdmVEYXRhKCd6ZlBsdWdpbicpXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBiZWVuIGRlc3Ryb3llZC5cbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2Rlc3Ryb3llZFxuICAgICAgICAgICAqL1xuICAgICAgICAgIC50cmlnZ2VyKGBkZXN0cm95ZWQuemYuJHtwbHVnaW5OYW1lfWApO1xuICAgIGZvcih2YXIgcHJvcCBpbiBwbHVnaW4pe1xuICAgICAgcGx1Z2luW3Byb3BdID0gbnVsbDsvL2NsZWFuIHVwIHNjcmlwdCB0byBwcmVwIGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgfVxuICAgIHJldHVybjtcbiAgfSxcblxuICAvKipcbiAgICogQGZ1bmN0aW9uXG4gICAqIENhdXNlcyBvbmUgb3IgbW9yZSBhY3RpdmUgcGx1Z2lucyB0byByZS1pbml0aWFsaXplLCByZXNldHRpbmcgZXZlbnQgbGlzdGVuZXJzLCByZWNhbGN1bGF0aW5nIHBvc2l0aW9ucywgZXRjLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGx1Z2lucyAtIG9wdGlvbmFsIHN0cmluZyBvZiBhbiBpbmRpdmlkdWFsIHBsdWdpbiBrZXksIGF0dGFpbmVkIGJ5IGNhbGxpbmcgYCQoZWxlbWVudCkuZGF0YSgncGx1Z2luTmFtZScpYCwgb3Igc3RyaW5nIG9mIGEgcGx1Z2luIGNsYXNzIGkuZS4gYCdkcm9wZG93bidgXG4gICAqIEBkZWZhdWx0IElmIG5vIGFyZ3VtZW50IGlzIHBhc3NlZCwgcmVmbG93IGFsbCBjdXJyZW50bHkgYWN0aXZlIHBsdWdpbnMuXG4gICAqL1xuICAgcmVJbml0OiBmdW5jdGlvbihwbHVnaW5zKXtcbiAgICAgdmFyIGlzSlEgPSBwbHVnaW5zIGluc3RhbmNlb2YgJDtcbiAgICAgdHJ5e1xuICAgICAgIGlmKGlzSlEpe1xuICAgICAgICAgcGx1Z2lucy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICQodGhpcykuZGF0YSgnemZQbHVnaW4nKS5faW5pdCgpO1xuICAgICAgICAgfSk7XG4gICAgICAgfWVsc2V7XG4gICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBwbHVnaW5zLFxuICAgICAgICAgX3RoaXMgPSB0aGlzLFxuICAgICAgICAgZm5zID0ge1xuICAgICAgICAgICAnb2JqZWN0JzogZnVuY3Rpb24ocGxncyl7XG4gICAgICAgICAgICAgcGxncy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuICAgICAgICAgICAgICAgcCA9IGh5cGhlbmF0ZShwKTtcbiAgICAgICAgICAgICAgICQoJ1tkYXRhLScrIHAgKyddJykuZm91bmRhdGlvbignX2luaXQnKTtcbiAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgfSxcbiAgICAgICAgICAgJ3N0cmluZyc6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgcGx1Z2lucyA9IGh5cGhlbmF0ZShwbHVnaW5zKTtcbiAgICAgICAgICAgICAkKCdbZGF0YS0nKyBwbHVnaW5zICsnXScpLmZvdW5kYXRpb24oJ19pbml0Jyk7XG4gICAgICAgICAgIH0sXG4gICAgICAgICAgICd1bmRlZmluZWQnOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgIHRoaXNbJ29iamVjdCddKE9iamVjdC5rZXlzKF90aGlzLl9wbHVnaW5zKSk7XG4gICAgICAgICAgIH1cbiAgICAgICAgIH07XG4gICAgICAgICBmbnNbdHlwZV0ocGx1Z2lucyk7XG4gICAgICAgfVxuICAgICB9Y2F0Y2goZXJyKXtcbiAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgIH1maW5hbGx5e1xuICAgICAgIHJldHVybiBwbHVnaW5zO1xuICAgICB9XG4gICB9LFxuXG4gIC8qKlxuICAgKiByZXR1cm5zIGEgcmFuZG9tIGJhc2UtMzYgdWlkIHdpdGggbmFtZXNwYWNpbmdcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsZW5ndGggLSBudW1iZXIgb2YgcmFuZG9tIGJhc2UtMzYgZGlnaXRzIGRlc2lyZWQuIEluY3JlYXNlIGZvciBtb3JlIHJhbmRvbSBzdHJpbmdzLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlIC0gbmFtZSBvZiBwbHVnaW4gdG8gYmUgaW5jb3Jwb3JhdGVkIGluIHVpZCwgb3B0aW9uYWwuXG4gICAqIEBkZWZhdWx0IHtTdHJpbmd9ICcnIC0gaWYgbm8gcGx1Z2luIG5hbWUgaXMgcHJvdmlkZWQsIG5vdGhpbmcgaXMgYXBwZW5kZWQgdG8gdGhlIHVpZC5cbiAgICogQHJldHVybnMge1N0cmluZ30gLSB1bmlxdWUgaWRcbiAgICovXG4gIEdldFlvRGlnaXRzOiBmdW5jdGlvbihsZW5ndGgsIG5hbWVzcGFjZSl7XG4gICAgbGVuZ3RoID0gbGVuZ3RoIHx8IDY7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoKE1hdGgucG93KDM2LCBsZW5ndGggKyAxKSAtIE1hdGgucmFuZG9tKCkgKiBNYXRoLnBvdygzNiwgbGVuZ3RoKSkpLnRvU3RyaW5nKDM2KS5zbGljZSgxKSArIChuYW1lc3BhY2UgPyBgLSR7bmFtZXNwYWNlfWAgOiAnJyk7XG4gIH0sXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHBsdWdpbnMgb24gYW55IGVsZW1lbnRzIHdpdGhpbiBgZWxlbWAgKGFuZCBgZWxlbWAgaXRzZWxmKSB0aGF0IGFyZW4ndCBhbHJlYWR5IGluaXRpYWxpemVkLlxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbSAtIGpRdWVyeSBvYmplY3QgY29udGFpbmluZyB0aGUgZWxlbWVudCB0byBjaGVjayBpbnNpZGUuIEFsc28gY2hlY2tzIHRoZSBlbGVtZW50IGl0c2VsZiwgdW5sZXNzIGl0J3MgdGhlIGBkb2N1bWVudGAgb2JqZWN0LlxuICAgKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gcGx1Z2lucyAtIEEgbGlzdCBvZiBwbHVnaW5zIHRvIGluaXRpYWxpemUuIExlYXZlIHRoaXMgb3V0IHRvIGluaXRpYWxpemUgZXZlcnl0aGluZy5cbiAgICovXG4gIHJlZmxvdzogZnVuY3Rpb24oZWxlbSwgcGx1Z2lucykge1xuXG4gICAgLy8gSWYgcGx1Z2lucyBpcyB1bmRlZmluZWQsIGp1c3QgZ3JhYiBldmVyeXRoaW5nXG4gICAgaWYgKHR5cGVvZiBwbHVnaW5zID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcGx1Z2lucyA9IE9iamVjdC5rZXlzKHRoaXMuX3BsdWdpbnMpO1xuICAgIH1cbiAgICAvLyBJZiBwbHVnaW5zIGlzIGEgc3RyaW5nLCBjb252ZXJ0IGl0IHRvIGFuIGFycmF5IHdpdGggb25lIGl0ZW1cbiAgICBlbHNlIGlmICh0eXBlb2YgcGx1Z2lucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHBsdWdpbnMgPSBbcGx1Z2luc107XG4gICAgfVxuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHBsdWdpblxuICAgICQuZWFjaChwbHVnaW5zLCBmdW5jdGlvbihpLCBuYW1lKSB7XG4gICAgICAvLyBHZXQgdGhlIGN1cnJlbnQgcGx1Z2luXG4gICAgICB2YXIgcGx1Z2luID0gX3RoaXMuX3BsdWdpbnNbbmFtZV07XG5cbiAgICAgIC8vIExvY2FsaXplIHRoZSBzZWFyY2ggdG8gYWxsIGVsZW1lbnRzIGluc2lkZSBlbGVtLCBhcyB3ZWxsIGFzIGVsZW0gaXRzZWxmLCB1bmxlc3MgZWxlbSA9PT0gZG9jdW1lbnRcbiAgICAgIHZhciAkZWxlbSA9ICQoZWxlbSkuZmluZCgnW2RhdGEtJytuYW1lKyddJykuYWRkQmFjaygnW2RhdGEtJytuYW1lKyddJyk7XG5cbiAgICAgIC8vIEZvciBlYWNoIHBsdWdpbiBmb3VuZCwgaW5pdGlhbGl6ZSBpdFxuICAgICAgJGVsZW0uZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRlbCA9ICQodGhpcyksXG4gICAgICAgICAgICBvcHRzID0ge307XG4gICAgICAgIC8vIERvbid0IGRvdWJsZS1kaXAgb24gcGx1Z2luc1xuICAgICAgICBpZiAoJGVsLmRhdGEoJ3pmUGx1Z2luJykpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJUcmllZCB0byBpbml0aWFsaXplIFwiK25hbWUrXCIgb24gYW4gZWxlbWVudCB0aGF0IGFscmVhZHkgaGFzIGEgRm91bmRhdGlvbiBwbHVnaW4uXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCRlbC5hdHRyKCdkYXRhLW9wdGlvbnMnKSl7XG4gICAgICAgICAgdmFyIHRoaW5nID0gJGVsLmF0dHIoJ2RhdGEtb3B0aW9ucycpLnNwbGl0KCc7JykuZm9yRWFjaChmdW5jdGlvbihlLCBpKXtcbiAgICAgICAgICAgIHZhciBvcHQgPSBlLnNwbGl0KCc6JykubWFwKGZ1bmN0aW9uKGVsKXsgcmV0dXJuIGVsLnRyaW0oKTsgfSk7XG4gICAgICAgICAgICBpZihvcHRbMF0pIG9wdHNbb3B0WzBdXSA9IHBhcnNlVmFsdWUob3B0WzFdKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0cnl7XG4gICAgICAgICAgJGVsLmRhdGEoJ3pmUGx1Z2luJywgbmV3IHBsdWdpbigkKHRoaXMpLCBvcHRzKSk7XG4gICAgICAgIH1jYXRjaChlcil7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcik7XG4gICAgICAgIH1maW5hbGx5e1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG4gIGdldEZuTmFtZTogZnVuY3Rpb25OYW1lLFxuICB0cmFuc2l0aW9uZW5kOiBmdW5jdGlvbigkZWxlbSl7XG4gICAgdmFyIHRyYW5zaXRpb25zID0ge1xuICAgICAgJ3RyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgICAnV2Via2l0VHJhbnNpdGlvbic6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAgICdNb3pUcmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuICAgICAgJ09UcmFuc2l0aW9uJzogJ290cmFuc2l0aW9uZW5kJ1xuICAgIH07XG4gICAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgZW5kO1xuXG4gICAgZm9yICh2YXIgdCBpbiB0cmFuc2l0aW9ucyl7XG4gICAgICBpZiAodHlwZW9mIGVsZW0uc3R5bGVbdF0gIT09ICd1bmRlZmluZWQnKXtcbiAgICAgICAgZW5kID0gdHJhbnNpdGlvbnNbdF07XG4gICAgICB9XG4gICAgfVxuICAgIGlmKGVuZCl7XG4gICAgICByZXR1cm4gZW5kO1xuICAgIH1lbHNle1xuICAgICAgZW5kID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAkZWxlbS50cmlnZ2VySGFuZGxlcigndHJhbnNpdGlvbmVuZCcsIFskZWxlbV0pO1xuICAgICAgfSwgMSk7XG4gICAgICByZXR1cm4gJ3RyYW5zaXRpb25lbmQnO1xuICAgIH1cbiAgfVxufTtcblxuRm91bmRhdGlvbi51dGlsID0ge1xuICAvKipcbiAgICogRnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgZGVib3VuY2UgZWZmZWN0IHRvIGEgZnVuY3Rpb24gY2FsbC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgLSBGdW5jdGlvbiB0byBiZSBjYWxsZWQgYXQgZW5kIG9mIHRpbWVvdXQuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBkZWxheSAtIFRpbWUgaW4gbXMgdG8gZGVsYXkgdGhlIGNhbGwgb2YgYGZ1bmNgLlxuICAgKiBAcmV0dXJucyBmdW5jdGlvblxuICAgKi9cbiAgdGhyb3R0bGU6IGZ1bmN0aW9uIChmdW5jLCBkZWxheSkge1xuICAgIHZhciB0aW1lciA9IG51bGw7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuXG4gICAgICBpZiAodGltZXIgPT09IG51bGwpIHtcbiAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgfSwgZGVsYXkpO1xuICAgICAgfVxuICAgIH07XG4gIH1cbn07XG5cbi8vIFRPRE86IGNvbnNpZGVyIG5vdCBtYWtpbmcgdGhpcyBhIGpRdWVyeSBmdW5jdGlvblxuLy8gVE9ETzogbmVlZCB3YXkgdG8gcmVmbG93IHZzLiByZS1pbml0aWFsaXplXG4vKipcbiAqIFRoZSBGb3VuZGF0aW9uIGpRdWVyeSBtZXRob2QuXG4gKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gbWV0aG9kIC0gQW4gYWN0aW9uIHRvIHBlcmZvcm0gb24gdGhlIGN1cnJlbnQgalF1ZXJ5IG9iamVjdC5cbiAqL1xudmFyIGZvdW5kYXRpb24gPSBmdW5jdGlvbihtZXRob2QpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgbWV0aG9kLFxuICAgICAgJG1ldGEgPSAkKCdtZXRhLmZvdW5kYXRpb24tbXEnKSxcbiAgICAgICRub0pTID0gJCgnLm5vLWpzJyk7XG5cbiAgaWYoISRtZXRhLmxlbmd0aCl7XG4gICAgJCgnPG1ldGEgY2xhc3M9XCJmb3VuZGF0aW9uLW1xXCI+JykuYXBwZW5kVG8oZG9jdW1lbnQuaGVhZCk7XG4gIH1cbiAgaWYoJG5vSlMubGVuZ3RoKXtcbiAgICAkbm9KUy5yZW1vdmVDbGFzcygnbm8tanMnKTtcbiAgfVxuXG4gIGlmKHR5cGUgPT09ICd1bmRlZmluZWQnKXsvL25lZWRzIHRvIGluaXRpYWxpemUgdGhlIEZvdW5kYXRpb24gb2JqZWN0LCBvciBhbiBpbmRpdmlkdWFsIHBsdWdpbi5cbiAgICBGb3VuZGF0aW9uLk1lZGlhUXVlcnkuX2luaXQoKTtcbiAgICBGb3VuZGF0aW9uLnJlZmxvdyh0aGlzKTtcbiAgfWVsc2UgaWYodHlwZSA9PT0gJ3N0cmluZycpey8vYW4gaW5kaXZpZHVhbCBtZXRob2QgdG8gaW52b2tlIG9uIGEgcGx1Z2luIG9yIGdyb3VwIG9mIHBsdWdpbnNcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7Ly9jb2xsZWN0IGFsbCB0aGUgYXJndW1lbnRzLCBpZiBuZWNlc3NhcnlcbiAgICB2YXIgcGx1Z0NsYXNzID0gdGhpcy5kYXRhKCd6ZlBsdWdpbicpOy8vZGV0ZXJtaW5lIHRoZSBjbGFzcyBvZiBwbHVnaW5cblxuICAgIGlmKHBsdWdDbGFzcyAhPT0gdW5kZWZpbmVkICYmIHBsdWdDbGFzc1ttZXRob2RdICE9PSB1bmRlZmluZWQpey8vbWFrZSBzdXJlIGJvdGggdGhlIGNsYXNzIGFuZCBtZXRob2QgZXhpc3RcbiAgICAgIGlmKHRoaXMubGVuZ3RoID09PSAxKXsvL2lmIHRoZXJlJ3Mgb25seSBvbmUsIGNhbGwgaXQgZGlyZWN0bHkuXG4gICAgICAgICAgcGx1Z0NsYXNzW21ldGhvZF0uYXBwbHkocGx1Z0NsYXNzLCBhcmdzKTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSwgZWwpey8vb3RoZXJ3aXNlIGxvb3AgdGhyb3VnaCB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24gYW5kIGludm9rZSB0aGUgbWV0aG9kIG9uIGVhY2hcbiAgICAgICAgICBwbHVnQ2xhc3NbbWV0aG9kXS5hcHBseSgkKGVsKS5kYXRhKCd6ZlBsdWdpbicpLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfWVsc2V7Ly9lcnJvciBmb3Igbm8gY2xhc3Mgb3Igbm8gbWV0aG9kXG4gICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJXZSdyZSBzb3JyeSwgJ1wiICsgbWV0aG9kICsgXCInIGlzIG5vdCBhbiBhdmFpbGFibGUgbWV0aG9kIGZvciBcIiArIChwbHVnQ2xhc3MgPyBmdW5jdGlvbk5hbWUocGx1Z0NsYXNzKSA6ICd0aGlzIGVsZW1lbnQnKSArICcuJyk7XG4gICAgfVxuICB9ZWxzZXsvL2Vycm9yIGZvciBpbnZhbGlkIGFyZ3VtZW50IHR5cGVcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBXZSdyZSBzb3JyeSwgJHt0eXBlfSBpcyBub3QgYSB2YWxpZCBwYXJhbWV0ZXIuIFlvdSBtdXN0IHVzZSBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIG1ldGhvZCB5b3Ugd2lzaCB0byBpbnZva2UuYCk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG53aW5kb3cuRm91bmRhdGlvbiA9IEZvdW5kYXRpb247XG4kLmZuLmZvdW5kYXRpb24gPSBmb3VuZGF0aW9uO1xuXG4vLyBQb2x5ZmlsbCBmb3IgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4oZnVuY3Rpb24oKSB7XG4gIGlmICghRGF0ZS5ub3cgfHwgIXdpbmRvdy5EYXRlLm5vdylcbiAgICB3aW5kb3cuRGF0ZS5ub3cgPSBEYXRlLm5vdyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7IH07XG5cbiAgdmFyIHZlbmRvcnMgPSBbJ3dlYmtpdCcsICdtb3onXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKytpKSB7XG4gICAgICB2YXIgdnAgPSB2ZW5kb3JzW2ldO1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2cCsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSAod2luZG93W3ZwKydDYW5jZWxBbmltYXRpb25GcmFtZSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCB3aW5kb3dbdnArJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddKTtcbiAgfVxuICBpZiAoL2lQKGFkfGhvbmV8b2QpLipPUyA2Ly50ZXN0KHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KVxuICAgIHx8ICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8ICF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpIHtcbiAgICB2YXIgbGFzdFRpbWUgPSAwO1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdmFyIG5leHRUaW1lID0gTWF0aC5tYXgobGFzdFRpbWUgKyAxNiwgbm93KTtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGxhc3RUaW1lID0gbmV4dFRpbWUpOyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0VGltZSAtIG5vdyk7XG4gICAgfTtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBjbGVhclRpbWVvdXQ7XG4gIH1cbiAgLyoqXG4gICAqIFBvbHlmaWxsIGZvciBwZXJmb3JtYW5jZS5ub3csIHJlcXVpcmVkIGJ5IHJBRlxuICAgKi9cbiAgaWYoIXdpbmRvdy5wZXJmb3JtYW5jZSB8fCAhd2luZG93LnBlcmZvcm1hbmNlLm5vdyl7XG4gICAgd2luZG93LnBlcmZvcm1hbmNlID0ge1xuICAgICAgc3RhcnQ6IERhdGUubm93KCksXG4gICAgICBub3c6IGZ1bmN0aW9uKCl7IHJldHVybiBEYXRlLm5vdygpIC0gdGhpcy5zdGFydDsgfVxuICAgIH07XG4gIH1cbn0pKCk7XG5pZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XG4gIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24ob1RoaXMpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIGNsb3Nlc3QgdGhpbmcgcG9zc2libGUgdG8gdGhlIEVDTUFTY3JpcHQgNVxuICAgICAgLy8gaW50ZXJuYWwgSXNDYWxsYWJsZSBmdW5jdGlvblxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgLSB3aGF0IGlzIHRyeWluZyB0byBiZSBib3VuZCBpcyBub3QgY2FsbGFibGUnKTtcbiAgICB9XG5cbiAgICB2YXIgYUFyZ3MgICA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksXG4gICAgICAgIGZUb0JpbmQgPSB0aGlzLFxuICAgICAgICBmTk9QICAgID0gZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgZkJvdW5kICA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBmVG9CaW5kLmFwcGx5KHRoaXMgaW5zdGFuY2VvZiBmTk9QXG4gICAgICAgICAgICAgICAgID8gdGhpc1xuICAgICAgICAgICAgICAgICA6IG9UaGlzLFxuICAgICAgICAgICAgICAgICBhQXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9O1xuXG4gICAgaWYgKHRoaXMucHJvdG90eXBlKSB7XG4gICAgICAvLyBuYXRpdmUgZnVuY3Rpb25zIGRvbid0IGhhdmUgYSBwcm90b3R5cGVcbiAgICAgIGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XG4gICAgfVxuICAgIGZCb3VuZC5wcm90b3R5cGUgPSBuZXcgZk5PUCgpO1xuXG4gICAgcmV0dXJuIGZCb3VuZDtcbiAgfTtcbn1cbi8vIFBvbHlmaWxsIHRvIGdldCB0aGUgbmFtZSBvZiBhIGZ1bmN0aW9uIGluIElFOVxuZnVuY3Rpb24gZnVuY3Rpb25OYW1lKGZuKSB7XG4gIGlmIChGdW5jdGlvbi5wcm90b3R5cGUubmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdmFyIGZ1bmNOYW1lUmVnZXggPSAvZnVuY3Rpb25cXHMoW14oXXsxLH0pXFwoLztcbiAgICB2YXIgcmVzdWx0cyA9IChmdW5jTmFtZVJlZ2V4KS5leGVjKChmbikudG9TdHJpbmcoKSk7XG4gICAgcmV0dXJuIChyZXN1bHRzICYmIHJlc3VsdHMubGVuZ3RoID4gMSkgPyByZXN1bHRzWzFdLnRyaW0oKSA6IFwiXCI7XG4gIH1cbiAgZWxzZSBpZiAoZm4ucHJvdG90eXBlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZm4uY29uc3RydWN0b3IubmFtZTtcbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gZm4ucHJvdG90eXBlLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cbn1cbmZ1bmN0aW9uIHBhcnNlVmFsdWUoc3RyKXtcbiAgaWYoL3RydWUvLnRlc3Qoc3RyKSkgcmV0dXJuIHRydWU7XG4gIGVsc2UgaWYoL2ZhbHNlLy50ZXN0KHN0cikpIHJldHVybiBmYWxzZTtcbiAgZWxzZSBpZighaXNOYU4oc3RyICogMSkpIHJldHVybiBwYXJzZUZsb2F0KHN0cik7XG4gIHJldHVybiBzdHI7XG59XG4vLyBDb252ZXJ0IFBhc2NhbENhc2UgdG8ga2ViYWItY2FzZVxuLy8gVGhhbmsgeW91OiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS84OTU1NTgwXG5mdW5jdGlvbiBoeXBoZW5hdGUoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcbn1cblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5Gb3VuZGF0aW9uLkJveCA9IHtcbiAgSW1Ob3RUb3VjaGluZ1lvdTogSW1Ob3RUb3VjaGluZ1lvdSxcbiAgR2V0RGltZW5zaW9uczogR2V0RGltZW5zaW9ucyxcbiAgR2V0T2Zmc2V0czogR2V0T2Zmc2V0c1xufVxuXG4vKipcbiAqIENvbXBhcmVzIHRoZSBkaW1lbnNpb25zIG9mIGFuIGVsZW1lbnQgdG8gYSBjb250YWluZXIgYW5kIGRldGVybWluZXMgY29sbGlzaW9uIGV2ZW50cyB3aXRoIGNvbnRhaW5lci5cbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHRlc3QgZm9yIGNvbGxpc2lvbnMuXG4gKiBAcGFyYW0ge2pRdWVyeX0gcGFyZW50IC0galF1ZXJ5IG9iamVjdCB0byB1c2UgYXMgYm91bmRpbmcgY29udGFpbmVyLlxuICogQHBhcmFtIHtCb29sZWFufSBsck9ubHkgLSBzZXQgdG8gdHJ1ZSB0byBjaGVjayBsZWZ0IGFuZCByaWdodCB2YWx1ZXMgb25seS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gdGJPbmx5IC0gc2V0IHRvIHRydWUgdG8gY2hlY2sgdG9wIGFuZCBib3R0b20gdmFsdWVzIG9ubHkuXG4gKiBAZGVmYXVsdCBpZiBubyBwYXJlbnQgb2JqZWN0IHBhc3NlZCwgZGV0ZWN0cyBjb2xsaXNpb25zIHdpdGggYHdpbmRvd2AuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSB0cnVlIGlmIGNvbGxpc2lvbiBmcmVlLCBmYWxzZSBpZiBhIGNvbGxpc2lvbiBpbiBhbnkgZGlyZWN0aW9uLlxuICovXG5mdW5jdGlvbiBJbU5vdFRvdWNoaW5nWW91KGVsZW1lbnQsIHBhcmVudCwgbHJPbmx5LCB0Yk9ubHkpIHtcbiAgdmFyIGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxuICAgICAgdG9wLCBib3R0b20sIGxlZnQsIHJpZ2h0O1xuXG4gIGlmIChwYXJlbnQpIHtcbiAgICB2YXIgcGFyRGltcyA9IEdldERpbWVuc2lvbnMocGFyZW50KTtcblxuICAgIGJvdHRvbSA9IChlbGVEaW1zLm9mZnNldC50b3AgKyBlbGVEaW1zLmhlaWdodCA8PSBwYXJEaW1zLmhlaWdodCArIHBhckRpbXMub2Zmc2V0LnRvcCk7XG4gICAgdG9wICAgID0gKGVsZURpbXMub2Zmc2V0LnRvcCA+PSBwYXJEaW1zLm9mZnNldC50b3ApO1xuICAgIGxlZnQgICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ID49IHBhckRpbXMub2Zmc2V0LmxlZnQpO1xuICAgIHJpZ2h0ICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCA8PSBwYXJEaW1zLndpZHRoKTtcbiAgfVxuICBlbHNlIHtcbiAgICBib3R0b20gPSAoZWxlRGltcy5vZmZzZXQudG9wICsgZWxlRGltcy5oZWlnaHQgPD0gZWxlRGltcy53aW5kb3dEaW1zLmhlaWdodCArIGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wKTtcbiAgICB0b3AgICAgPSAoZWxlRGltcy5vZmZzZXQudG9wID49IGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wKTtcbiAgICBsZWZ0ICAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCA+PSBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LmxlZnQpO1xuICAgIHJpZ2h0ICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCA8PSBlbGVEaW1zLndpbmRvd0RpbXMud2lkdGgpO1xuICB9XG5cbiAgdmFyIGFsbERpcnMgPSBbYm90dG9tLCB0b3AsIGxlZnQsIHJpZ2h0XTtcblxuICBpZiAobHJPbmx5KSB7XG4gICAgcmV0dXJuIGxlZnQgPT09IHJpZ2h0ID09PSB0cnVlO1xuICB9XG5cbiAgaWYgKHRiT25seSkge1xuICAgIHJldHVybiB0b3AgPT09IGJvdHRvbSA9PT0gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBhbGxEaXJzLmluZGV4T2YoZmFsc2UpID09PSAtMTtcbn07XG5cbi8qKlxuICogVXNlcyBuYXRpdmUgbWV0aG9kcyB0byByZXR1cm4gYW4gb2JqZWN0IG9mIGRpbWVuc2lvbiB2YWx1ZXMuXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5IHx8IEhUTUx9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IG9yIERPTSBlbGVtZW50IGZvciB3aGljaCB0byBnZXQgdGhlIGRpbWVuc2lvbnMuIENhbiBiZSBhbnkgZWxlbWVudCBvdGhlciB0aGF0IGRvY3VtZW50IG9yIHdpbmRvdy5cbiAqIEByZXR1cm5zIHtPYmplY3R9IC0gbmVzdGVkIG9iamVjdCBvZiBpbnRlZ2VyIHBpeGVsIHZhbHVlc1xuICogVE9ETyAtIGlmIGVsZW1lbnQgaXMgd2luZG93LCByZXR1cm4gb25seSB0aG9zZSB2YWx1ZXMuXG4gKi9cbmZ1bmN0aW9uIEdldERpbWVuc2lvbnMoZWxlbSwgdGVzdCl7XG4gIGVsZW0gPSBlbGVtLmxlbmd0aCA/IGVsZW1bMF0gOiBlbGVtO1xuXG4gIGlmIChlbGVtID09PSB3aW5kb3cgfHwgZWxlbSA9PT0gZG9jdW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJJ20gc29ycnksIERhdmUuIEknbSBhZnJhaWQgSSBjYW4ndCBkbyB0aGF0LlwiKTtcbiAgfVxuXG4gIHZhciByZWN0ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHBhclJlY3QgPSBlbGVtLnBhcmVudE5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICB3aW5SZWN0ID0gZG9jdW1lbnQuYm9keS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHdpblkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXG4gICAgICB3aW5YID0gd2luZG93LnBhZ2VYT2Zmc2V0O1xuXG4gIHJldHVybiB7XG4gICAgd2lkdGg6IHJlY3Qud2lkdGgsXG4gICAgaGVpZ2h0OiByZWN0LmhlaWdodCxcbiAgICBvZmZzZXQ6IHtcbiAgICAgIHRvcDogcmVjdC50b3AgKyB3aW5ZLFxuICAgICAgbGVmdDogcmVjdC5sZWZ0ICsgd2luWFxuICAgIH0sXG4gICAgcGFyZW50RGltczoge1xuICAgICAgd2lkdGg6IHBhclJlY3Qud2lkdGgsXG4gICAgICBoZWlnaHQ6IHBhclJlY3QuaGVpZ2h0LFxuICAgICAgb2Zmc2V0OiB7XG4gICAgICAgIHRvcDogcGFyUmVjdC50b3AgKyB3aW5ZLFxuICAgICAgICBsZWZ0OiBwYXJSZWN0LmxlZnQgKyB3aW5YXG4gICAgICB9XG4gICAgfSxcbiAgICB3aW5kb3dEaW1zOiB7XG4gICAgICB3aWR0aDogd2luUmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogd2luUmVjdC5oZWlnaHQsXG4gICAgICBvZmZzZXQ6IHtcbiAgICAgICAgdG9wOiB3aW5ZLFxuICAgICAgICBsZWZ0OiB3aW5YXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBvYmplY3Qgb2YgdG9wIGFuZCBsZWZ0IGludGVnZXIgcGl4ZWwgdmFsdWVzIGZvciBkeW5hbWljYWxseSByZW5kZXJlZCBlbGVtZW50cyxcbiAqIHN1Y2ggYXM6IFRvb2x0aXAsIFJldmVhbCwgYW5kIERyb3Bkb3duXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCBmb3IgdGhlIGVsZW1lbnQgYmVpbmcgcG9zaXRpb25lZC5cbiAqIEBwYXJhbSB7alF1ZXJ5fSBhbmNob3IgLSBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZWxlbWVudCdzIGFuY2hvciBwb2ludC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBwb3NpdGlvbiAtIGEgc3RyaW5nIHJlbGF0aW5nIHRvIHRoZSBkZXNpcmVkIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50LCByZWxhdGl2ZSB0byBpdCdzIGFuY2hvclxuICogQHBhcmFtIHtOdW1iZXJ9IHZPZmZzZXQgLSBpbnRlZ2VyIHBpeGVsIHZhbHVlIG9mIGRlc2lyZWQgdmVydGljYWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBoT2Zmc2V0IC0gaW50ZWdlciBwaXhlbCB2YWx1ZSBvZiBkZXNpcmVkIGhvcml6b250YWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNPdmVyZmxvdyAtIGlmIGEgY29sbGlzaW9uIGV2ZW50IGlzIGRldGVjdGVkLCBzZXRzIHRvIHRydWUgdG8gZGVmYXVsdCB0aGUgZWxlbWVudCB0byBmdWxsIHdpZHRoIC0gYW55IGRlc2lyZWQgb2Zmc2V0LlxuICogVE9ETyBhbHRlci9yZXdyaXRlIHRvIHdvcmsgd2l0aCBgZW1gIHZhbHVlcyBhcyB3ZWxsL2luc3RlYWQgb2YgcGl4ZWxzXG4gKi9cbmZ1bmN0aW9uIEdldE9mZnNldHMoZWxlbWVudCwgYW5jaG9yLCBwb3NpdGlvbiwgdk9mZnNldCwgaE9mZnNldCwgaXNPdmVyZmxvdykge1xuICB2YXIgJGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxuICAgICAgJGFuY2hvckRpbXMgPSBhbmNob3IgPyBHZXREaW1lbnNpb25zKGFuY2hvcikgOiBudWxsO1xuXG4gIHN3aXRjaCAocG9zaXRpb24pIHtcbiAgICBjYXNlICd0b3AnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKEZvdW5kYXRpb24ucnRsKCkgPyAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICRlbGVEaW1zLndpZHRoICsgJGFuY2hvckRpbXMud2lkdGggOiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbGVmdCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICgkZWxlRGltcy53aWR0aCArIGhPZmZzZXQpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgJGFuY2hvckRpbXMud2lkdGggKyBoT2Zmc2V0LFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciB0b3AnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgKCRhbmNob3JEaW1zLndpZHRoIC8gMikpIC0gKCRlbGVEaW1zLndpZHRoIC8gMiksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyIGJvdHRvbSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiBpc092ZXJmbG93ID8gaE9mZnNldCA6ICgoJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAoJGFuY2hvckRpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodCArIHZPZmZzZXRcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciBsZWZ0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gKCRlbGVEaW1zLndpZHRoICsgaE9mZnNldCksXG4gICAgICAgIHRvcDogKCRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAoJGFuY2hvckRpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXIgcmlnaHQnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQgKyAxLFxuICAgICAgICB0b3A6ICgkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgKCRhbmNob3JEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICgkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0ICsgKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSxcbiAgICAgICAgdG9wOiAoJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wICsgKCRlbGVEaW1zLndpbmRvd0RpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyZXZlYWwnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLSAkZWxlRGltcy53aWR0aCkgLyAyLFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCArIHZPZmZzZXRcbiAgICAgIH1cbiAgICBjYXNlICdyZXZlYWwgZnVsbCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0LFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcFxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbGVmdCBib3R0b20nOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgLSAoJGVsZURpbXMud2lkdGggKyBoT2Zmc2V0KSxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0XG4gICAgICB9O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAncmlnaHQgYm90dG9tJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgJGFuY2hvckRpbXMud2lkdGggKyBoT2Zmc2V0IC0gJGVsZURpbXMud2lkdGgsXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodFxuICAgICAgfTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAoRm91bmRhdGlvbi5ydGwoKSA/ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gJGVsZURpbXMud2lkdGggKyAkYW5jaG9yRGltcy53aWR0aCA6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0KSxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0ICsgdk9mZnNldFxuICAgICAgfVxuICB9XG59XG5cbn0oalF1ZXJ5KTtcbiIsIi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogVGhpcyB1dGlsIHdhcyBjcmVhdGVkIGJ5IE1hcml1cyBPbGJlcnR6ICpcbiAqIFBsZWFzZSB0aGFuayBNYXJpdXMgb24gR2l0SHViIC9vd2xiZXJ0eiAqXG4gKiBvciB0aGUgd2ViIGh0dHA6Ly93d3cubWFyaXVzb2xiZXJ0ei5kZS8gKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuY29uc3Qga2V5Q29kZXMgPSB7XG4gIDk6ICdUQUInLFxuICAxMzogJ0VOVEVSJyxcbiAgMjc6ICdFU0NBUEUnLFxuICAzMjogJ1NQQUNFJyxcbiAgMzc6ICdBUlJPV19MRUZUJyxcbiAgMzg6ICdBUlJPV19VUCcsXG4gIDM5OiAnQVJST1dfUklHSFQnLFxuICA0MDogJ0FSUk9XX0RPV04nXG59XG5cbnZhciBjb21tYW5kcyA9IHt9XG5cbnZhciBLZXlib2FyZCA9IHtcbiAga2V5czogZ2V0S2V5Q29kZXMoa2V5Q29kZXMpLFxuXG4gIC8qKlxuICAgKiBQYXJzZXMgdGhlIChrZXlib2FyZCkgZXZlbnQgYW5kIHJldHVybnMgYSBTdHJpbmcgdGhhdCByZXByZXNlbnRzIGl0cyBrZXlcbiAgICogQ2FuIGJlIHVzZWQgbGlrZSBGb3VuZGF0aW9uLnBhcnNlS2V5KGV2ZW50KSA9PT0gRm91bmRhdGlvbi5rZXlzLlNQQUNFXG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gdGhlIGV2ZW50IGdlbmVyYXRlZCBieSB0aGUgZXZlbnQgaGFuZGxlclxuICAgKiBAcmV0dXJuIFN0cmluZyBrZXkgLSBTdHJpbmcgdGhhdCByZXByZXNlbnRzIHRoZSBrZXkgcHJlc3NlZFxuICAgKi9cbiAgcGFyc2VLZXkoZXZlbnQpIHtcbiAgICB2YXIga2V5ID0ga2V5Q29kZXNbZXZlbnQud2hpY2ggfHwgZXZlbnQua2V5Q29kZV0gfHwgU3RyaW5nLmZyb21DaGFyQ29kZShldmVudC53aGljaCkudG9VcHBlckNhc2UoKTtcbiAgICBpZiAoZXZlbnQuc2hpZnRLZXkpIGtleSA9IGBTSElGVF8ke2tleX1gO1xuICAgIGlmIChldmVudC5jdHJsS2V5KSBrZXkgPSBgQ1RSTF8ke2tleX1gO1xuICAgIGlmIChldmVudC5hbHRLZXkpIGtleSA9IGBBTFRfJHtrZXl9YDtcbiAgICByZXR1cm4ga2V5O1xuICB9LFxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHRoZSBnaXZlbiAoa2V5Ym9hcmQpIGV2ZW50XG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gdGhlIGV2ZW50IGdlbmVyYXRlZCBieSB0aGUgZXZlbnQgaGFuZGxlclxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50IC0gRm91bmRhdGlvbiBjb21wb25lbnQncyBuYW1lLCBlLmcuIFNsaWRlciBvciBSZXZlYWxcbiAgICogQHBhcmFtIHtPYmplY3RzfSBmdW5jdGlvbnMgLSBjb2xsZWN0aW9uIG9mIGZ1bmN0aW9ucyB0aGF0IGFyZSB0byBiZSBleGVjdXRlZFxuICAgKi9cbiAgaGFuZGxlS2V5KGV2ZW50LCBjb21wb25lbnQsIGZ1bmN0aW9ucykge1xuICAgIHZhciBjb21tYW5kTGlzdCA9IGNvbW1hbmRzW2NvbXBvbmVudF0sXG4gICAgICBrZXlDb2RlID0gdGhpcy5wYXJzZUtleShldmVudCksXG4gICAgICBjbWRzLFxuICAgICAgY29tbWFuZCxcbiAgICAgIGZuO1xuXG4gICAgaWYgKCFjb21tYW5kTGlzdCkgcmV0dXJuIGNvbnNvbGUud2FybignQ29tcG9uZW50IG5vdCBkZWZpbmVkIScpO1xuXG4gICAgaWYgKHR5cGVvZiBjb21tYW5kTGlzdC5sdHIgPT09ICd1bmRlZmluZWQnKSB7IC8vIHRoaXMgY29tcG9uZW50IGRvZXMgbm90IGRpZmZlcmVudGlhdGUgYmV0d2VlbiBsdHIgYW5kIHJ0bFxuICAgICAgICBjbWRzID0gY29tbWFuZExpc3Q7IC8vIHVzZSBwbGFpbiBsaXN0XG4gICAgfSBlbHNlIHsgLy8gbWVyZ2UgbHRyIGFuZCBydGw6IGlmIGRvY3VtZW50IGlzIHJ0bCwgcnRsIG92ZXJ3cml0ZXMgbHRyIGFuZCB2aWNlIHZlcnNhXG4gICAgICAgIGlmIChGb3VuZGF0aW9uLnJ0bCgpKSBjbWRzID0gJC5leHRlbmQoe30sIGNvbW1hbmRMaXN0Lmx0ciwgY29tbWFuZExpc3QucnRsKTtcblxuICAgICAgICBlbHNlIGNtZHMgPSAkLmV4dGVuZCh7fSwgY29tbWFuZExpc3QucnRsLCBjb21tYW5kTGlzdC5sdHIpO1xuICAgIH1cbiAgICBjb21tYW5kID0gY21kc1trZXlDb2RlXTtcblxuICAgIGZuID0gZnVuY3Rpb25zW2NvbW1hbmRdO1xuICAgIGlmIChmbiAmJiB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIHsgLy8gZXhlY3V0ZSBmdW5jdGlvbiAgaWYgZXhpc3RzXG4gICAgICBmbi5hcHBseSgpO1xuICAgICAgaWYgKGZ1bmN0aW9ucy5oYW5kbGVkIHx8IHR5cGVvZiBmdW5jdGlvbnMuaGFuZGxlZCA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uIHdoZW4gZXZlbnQgd2FzIGhhbmRsZWRcbiAgICAgICAgICBmdW5jdGlvbnMuaGFuZGxlZC5hcHBseSgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZnVuY3Rpb25zLnVuaGFuZGxlZCB8fCB0eXBlb2YgZnVuY3Rpb25zLnVuaGFuZGxlZCA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uIHdoZW4gZXZlbnQgd2FzIG5vdCBoYW5kbGVkXG4gICAgICAgICAgZnVuY3Rpb25zLnVuaGFuZGxlZC5hcHBseSgpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogRmluZHMgYWxsIGZvY3VzYWJsZSBlbGVtZW50cyB3aXRoaW4gdGhlIGdpdmVuIGAkZWxlbWVudGBcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBzZWFyY2ggd2l0aGluXG4gICAqIEByZXR1cm4ge2pRdWVyeX0gJGZvY3VzYWJsZSAtIGFsbCBmb2N1c2FibGUgZWxlbWVudHMgd2l0aGluIGAkZWxlbWVudGBcbiAgICovXG4gIGZpbmRGb2N1c2FibGUoJGVsZW1lbnQpIHtcbiAgICByZXR1cm4gJGVsZW1lbnQuZmluZCgnYVtocmVmXSwgYXJlYVtocmVmXSwgaW5wdXQ6bm90KFtkaXNhYmxlZF0pLCBzZWxlY3Q6bm90KFtkaXNhYmxlZF0pLCB0ZXh0YXJlYTpub3QoW2Rpc2FibGVkXSksIGJ1dHRvbjpub3QoW2Rpc2FibGVkXSksIGlmcmFtZSwgb2JqZWN0LCBlbWJlZCwgKlt0YWJpbmRleF0sICpbY29udGVudGVkaXRhYmxlXScpLmZpbHRlcihmdW5jdGlvbigpIHtcbiAgICAgIGlmICghJCh0aGlzKS5pcygnOnZpc2libGUnKSB8fCAkKHRoaXMpLmF0dHIoJ3RhYmluZGV4JykgPCAwKSB7IHJldHVybiBmYWxzZTsgfSAvL29ubHkgaGF2ZSB2aXNpYmxlIGVsZW1lbnRzIGFuZCB0aG9zZSB0aGF0IGhhdmUgYSB0YWJpbmRleCBncmVhdGVyIG9yIGVxdWFsIDBcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjb21wb25lbnQgbmFtZSBuYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnQgLSBGb3VuZGF0aW9uIGNvbXBvbmVudCwgZS5nLiBTbGlkZXIgb3IgUmV2ZWFsXG4gICAqIEByZXR1cm4gU3RyaW5nIGNvbXBvbmVudE5hbWVcbiAgICovXG5cbiAgcmVnaXN0ZXIoY29tcG9uZW50TmFtZSwgY21kcykge1xuICAgIGNvbW1hbmRzW2NvbXBvbmVudE5hbWVdID0gY21kcztcbiAgfVxufVxuXG4vKlxuICogQ29uc3RhbnRzIGZvciBlYXNpZXIgY29tcGFyaW5nLlxuICogQ2FuIGJlIHVzZWQgbGlrZSBGb3VuZGF0aW9uLnBhcnNlS2V5KGV2ZW50KSA9PT0gRm91bmRhdGlvbi5rZXlzLlNQQUNFXG4gKi9cbmZ1bmN0aW9uIGdldEtleUNvZGVzKGtjcykge1xuICB2YXIgayA9IHt9O1xuICBmb3IgKHZhciBrYyBpbiBrY3MpIGtba2NzW2tjXV0gPSBrY3Nba2NdO1xuICByZXR1cm4gaztcbn1cblxuRm91bmRhdGlvbi5LZXlib2FyZCA9IEtleWJvYXJkO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8vIERlZmF1bHQgc2V0IG9mIG1lZGlhIHF1ZXJpZXNcbmNvbnN0IGRlZmF1bHRRdWVyaWVzID0ge1xuICAnZGVmYXVsdCcgOiAnb25seSBzY3JlZW4nLFxuICBsYW5kc2NhcGUgOiAnb25seSBzY3JlZW4gYW5kIChvcmllbnRhdGlvbjogbGFuZHNjYXBlKScsXG4gIHBvcnRyYWl0IDogJ29ubHkgc2NyZWVuIGFuZCAob3JpZW50YXRpb246IHBvcnRyYWl0KScsXG4gIHJldGluYSA6ICdvbmx5IHNjcmVlbiBhbmQgKC13ZWJraXQtbWluLWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLS1tb3otZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kICgtby1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyLzEpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi1yZXNvbHV0aW9uOiAxOTJkcGkpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi1yZXNvbHV0aW9uOiAyZHBweCknXG59O1xuXG52YXIgTWVkaWFRdWVyeSA9IHtcbiAgcXVlcmllczogW10sXG5cbiAgY3VycmVudDogJycsXG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBtZWRpYSBxdWVyeSBoZWxwZXIsIGJ5IGV4dHJhY3RpbmcgdGhlIGJyZWFrcG9pbnQgbGlzdCBmcm9tIHRoZSBDU1MgYW5kIGFjdGl2YXRpbmcgdGhlIGJyZWFrcG9pbnQgd2F0Y2hlci5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGV4dHJhY3RlZFN0eWxlcyA9ICQoJy5mb3VuZGF0aW9uLW1xJykuY3NzKCdmb250LWZhbWlseScpO1xuICAgIHZhciBuYW1lZFF1ZXJpZXM7XG5cbiAgICBuYW1lZFF1ZXJpZXMgPSBwYXJzZVN0eWxlVG9PYmplY3QoZXh0cmFjdGVkU3R5bGVzKTtcblxuICAgIGZvciAodmFyIGtleSBpbiBuYW1lZFF1ZXJpZXMpIHtcbiAgICAgIHNlbGYucXVlcmllcy5wdXNoKHtcbiAgICAgICAgbmFtZToga2V5LFxuICAgICAgICB2YWx1ZTogYG9ubHkgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAke25hbWVkUXVlcmllc1trZXldfSlgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLmN1cnJlbnQgPSB0aGlzLl9nZXRDdXJyZW50U2l6ZSgpO1xuXG4gICAgdGhpcy5fd2F0Y2hlcigpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIHNjcmVlbiBpcyBhdCBsZWFzdCBhcyB3aWRlIGFzIGEgYnJlYWtwb2ludC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzaXplIC0gTmFtZSBvZiB0aGUgYnJlYWtwb2ludCB0byBjaGVjay5cbiAgICogQHJldHVybnMge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgYnJlYWtwb2ludCBtYXRjaGVzLCBgZmFsc2VgIGlmIGl0J3Mgc21hbGxlci5cbiAgICovXG4gIGF0TGVhc3Qoc2l6ZSkge1xuICAgIHZhciBxdWVyeSA9IHRoaXMuZ2V0KHNpemUpO1xuXG4gICAgaWYgKHF1ZXJ5KSB7XG4gICAgICByZXR1cm4gd2luZG93Lm1hdGNoTWVkaWEocXVlcnkpLm1hdGNoZXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtZWRpYSBxdWVyeSBvZiBhIGJyZWFrcG9pbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2l6ZSAtIE5hbWUgb2YgdGhlIGJyZWFrcG9pbnQgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfG51bGx9IC0gVGhlIG1lZGlhIHF1ZXJ5IG9mIHRoZSBicmVha3BvaW50LCBvciBgbnVsbGAgaWYgdGhlIGJyZWFrcG9pbnQgZG9lc24ndCBleGlzdC5cbiAgICovXG4gIGdldChzaXplKSB7XG4gICAgZm9yICh2YXIgaSBpbiB0aGlzLnF1ZXJpZXMpIHtcbiAgICAgIHZhciBxdWVyeSA9IHRoaXMucXVlcmllc1tpXTtcbiAgICAgIGlmIChzaXplID09PSBxdWVyeS5uYW1lKSByZXR1cm4gcXVlcnkudmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgYnJlYWtwb2ludCBuYW1lIGJ5IHRlc3RpbmcgZXZlcnkgYnJlYWtwb2ludCBhbmQgcmV0dXJuaW5nIHRoZSBsYXN0IG9uZSB0byBtYXRjaCAodGhlIGJpZ2dlc3Qgb25lKS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IE5hbWUgb2YgdGhlIGN1cnJlbnQgYnJlYWtwb2ludC5cbiAgICovXG4gIF9nZXRDdXJyZW50U2l6ZSgpIHtcbiAgICB2YXIgbWF0Y2hlZDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5xdWVyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcXVlcnkgPSB0aGlzLnF1ZXJpZXNbaV07XG5cbiAgICAgIGlmICh3aW5kb3cubWF0Y2hNZWRpYShxdWVyeS52YWx1ZSkubWF0Y2hlcykge1xuICAgICAgICBtYXRjaGVkID0gcXVlcnk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBtYXRjaGVkID09PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIG1hdGNoZWQubmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG1hdGNoZWQ7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBBY3RpdmF0ZXMgdGhlIGJyZWFrcG9pbnQgd2F0Y2hlciwgd2hpY2ggZmlyZXMgYW4gZXZlbnQgb24gdGhlIHdpbmRvdyB3aGVuZXZlciB0aGUgYnJlYWtwb2ludCBjaGFuZ2VzLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF93YXRjaGVyKCkge1xuICAgICQod2luZG93KS5vbigncmVzaXplLnpmLm1lZGlhcXVlcnknLCAoKSA9PiB7XG4gICAgICB2YXIgbmV3U2l6ZSA9IHRoaXMuX2dldEN1cnJlbnRTaXplKCk7XG5cbiAgICAgIGlmIChuZXdTaXplICE9PSB0aGlzLmN1cnJlbnQpIHtcbiAgICAgICAgLy8gQnJvYWRjYXN0IHRoZSBtZWRpYSBxdWVyeSBjaGFuZ2Ugb24gdGhlIHdpbmRvd1xuICAgICAgICAkKHdpbmRvdykudHJpZ2dlcignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgW25ld1NpemUsIHRoaXMuY3VycmVudF0pO1xuXG4gICAgICAgIC8vIENoYW5nZSB0aGUgY3VycmVudCBtZWRpYSBxdWVyeVxuICAgICAgICB0aGlzLmN1cnJlbnQgPSBuZXdTaXplO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59O1xuXG5Gb3VuZGF0aW9uLk1lZGlhUXVlcnkgPSBNZWRpYVF1ZXJ5O1xuXG4vLyBtYXRjaE1lZGlhKCkgcG9seWZpbGwgLSBUZXN0IGEgQ1NTIG1lZGlhIHR5cGUvcXVlcnkgaW4gSlMuXG4vLyBBdXRob3JzICYgY29weXJpZ2h0IChjKSAyMDEyOiBTY290dCBKZWhsLCBQYXVsIElyaXNoLCBOaWNob2xhcyBaYWthcywgRGF2aWQgS25pZ2h0LiBEdWFsIE1JVC9CU0QgbGljZW5zZVxud2luZG93Lm1hdGNoTWVkaWEgfHwgKHdpbmRvdy5tYXRjaE1lZGlhID0gZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBGb3IgYnJvd3NlcnMgdGhhdCBzdXBwb3J0IG1hdGNoTWVkaXVtIGFwaSBzdWNoIGFzIElFIDkgYW5kIHdlYmtpdFxuICB2YXIgc3R5bGVNZWRpYSA9ICh3aW5kb3cuc3R5bGVNZWRpYSB8fCB3aW5kb3cubWVkaWEpO1xuXG4gIC8vIEZvciB0aG9zZSB0aGF0IGRvbid0IHN1cHBvcnQgbWF0Y2hNZWRpdW1cbiAgaWYgKCFzdHlsZU1lZGlhKSB7XG4gICAgdmFyIHN0eWxlICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpLFxuICAgIHNjcmlwdCAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpWzBdLFxuICAgIGluZm8gICAgICAgID0gbnVsbDtcblxuICAgIHN0eWxlLnR5cGUgID0gJ3RleHQvY3NzJztcbiAgICBzdHlsZS5pZCAgICA9ICdtYXRjaG1lZGlhanMtdGVzdCc7XG5cbiAgICBzY3JpcHQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoc3R5bGUsIHNjcmlwdCk7XG5cbiAgICAvLyAnc3R5bGUuY3VycmVudFN0eWxlJyBpcyB1c2VkIGJ5IElFIDw9IDggYW5kICd3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZScgZm9yIGFsbCBvdGhlciBicm93c2Vyc1xuICAgIGluZm8gPSAoJ2dldENvbXB1dGVkU3R5bGUnIGluIHdpbmRvdykgJiYgd2luZG93LmdldENvbXB1dGVkU3R5bGUoc3R5bGUsIG51bGwpIHx8IHN0eWxlLmN1cnJlbnRTdHlsZTtcblxuICAgIHN0eWxlTWVkaWEgPSB7XG4gICAgICBtYXRjaE1lZGl1bShtZWRpYSkge1xuICAgICAgICB2YXIgdGV4dCA9IGBAbWVkaWEgJHttZWRpYX17ICNtYXRjaG1lZGlhanMtdGVzdCB7IHdpZHRoOiAxcHg7IH0gfWA7XG5cbiAgICAgICAgLy8gJ3N0eWxlLnN0eWxlU2hlZXQnIGlzIHVzZWQgYnkgSUUgPD0gOCBhbmQgJ3N0eWxlLnRleHRDb250ZW50JyBmb3IgYWxsIG90aGVyIGJyb3dzZXJzXG4gICAgICAgIGlmIChzdHlsZS5zdHlsZVNoZWV0KSB7XG4gICAgICAgICAgc3R5bGUuc3R5bGVTaGVldC5jc3NUZXh0ID0gdGV4dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHlsZS50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUZXN0IGlmIG1lZGlhIHF1ZXJ5IGlzIHRydWUgb3IgZmFsc2VcbiAgICAgICAgcmV0dXJuIGluZm8ud2lkdGggPT09ICcxcHgnO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbihtZWRpYSkge1xuICAgIHJldHVybiB7XG4gICAgICBtYXRjaGVzOiBzdHlsZU1lZGlhLm1hdGNoTWVkaXVtKG1lZGlhIHx8ICdhbGwnKSxcbiAgICAgIG1lZGlhOiBtZWRpYSB8fCAnYWxsJ1xuICAgIH07XG4gIH1cbn0oKSk7XG5cbi8vIFRoYW5rIHlvdTogaHR0cHM6Ly9naXRodWIuY29tL3NpbmRyZXNvcmh1cy9xdWVyeS1zdHJpbmdcbmZ1bmN0aW9uIHBhcnNlU3R5bGVUb09iamVjdChzdHIpIHtcbiAgdmFyIHN0eWxlT2JqZWN0ID0ge307XG5cbiAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHN0eWxlT2JqZWN0O1xuICB9XG5cbiAgc3RyID0gc3RyLnRyaW0oKS5zbGljZSgxLCAtMSk7IC8vIGJyb3dzZXJzIHJlLXF1b3RlIHN0cmluZyBzdHlsZSB2YWx1ZXNcblxuICBpZiAoIXN0cikge1xuICAgIHJldHVybiBzdHlsZU9iamVjdDtcbiAgfVxuXG4gIHN0eWxlT2JqZWN0ID0gc3RyLnNwbGl0KCcmJykucmVkdWNlKGZ1bmN0aW9uKHJldCwgcGFyYW0pIHtcbiAgICB2YXIgcGFydHMgPSBwYXJhbS5yZXBsYWNlKC9cXCsvZywgJyAnKS5zcGxpdCgnPScpO1xuICAgIHZhciBrZXkgPSBwYXJ0c1swXTtcbiAgICB2YXIgdmFsID0gcGFydHNbMV07XG4gICAga2V5ID0gZGVjb2RlVVJJQ29tcG9uZW50KGtleSk7XG5cbiAgICAvLyBtaXNzaW5nIGA9YCBzaG91bGQgYmUgYG51bGxgOlxuICAgIC8vIGh0dHA6Ly93My5vcmcvVFIvMjAxMi9XRC11cmwtMjAxMjA1MjQvI2NvbGxlY3QtdXJsLXBhcmFtZXRlcnNcbiAgICB2YWwgPSB2YWwgPT09IHVuZGVmaW5lZCA/IG51bGwgOiBkZWNvZGVVUklDb21wb25lbnQodmFsKTtcblxuICAgIGlmICghcmV0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHJldFtrZXldID0gdmFsO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyZXRba2V5XSkpIHtcbiAgICAgIHJldFtrZXldLnB1c2godmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0W2tleV0gPSBbcmV0W2tleV0sIHZhbF07XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH0sIHt9KTtcblxuICByZXR1cm4gc3R5bGVPYmplY3Q7XG59XG5cbkZvdW5kYXRpb24uTWVkaWFRdWVyeSA9IE1lZGlhUXVlcnk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBNb3Rpb24gbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLm1vdGlvblxuICovXG5cbmNvbnN0IGluaXRDbGFzc2VzICAgPSBbJ211aS1lbnRlcicsICdtdWktbGVhdmUnXTtcbmNvbnN0IGFjdGl2ZUNsYXNzZXMgPSBbJ211aS1lbnRlci1hY3RpdmUnLCAnbXVpLWxlYXZlLWFjdGl2ZSddO1xuXG5jb25zdCBNb3Rpb24gPSB7XG4gIGFuaW1hdGVJbjogZnVuY3Rpb24oZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICAgIGFuaW1hdGUodHJ1ZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XG4gIH0sXG5cbiAgYW5pbWF0ZU91dDogZnVuY3Rpb24oZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICAgIGFuaW1hdGUoZmFsc2UsIGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpO1xuICB9XG59XG5cbmZ1bmN0aW9uIE1vdmUoZHVyYXRpb24sIGVsZW0sIGZuKXtcbiAgdmFyIGFuaW0sIHByb2csIHN0YXJ0ID0gbnVsbDtcbiAgLy8gY29uc29sZS5sb2coJ2NhbGxlZCcpO1xuXG4gIGZ1bmN0aW9uIG1vdmUodHMpe1xuICAgIGlmKCFzdGFydCkgc3RhcnQgPSB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG4gICAgLy8gY29uc29sZS5sb2coc3RhcnQsIHRzKTtcbiAgICBwcm9nID0gdHMgLSBzdGFydDtcbiAgICBmbi5hcHBseShlbGVtKTtcblxuICAgIGlmKHByb2cgPCBkdXJhdGlvbil7IGFuaW0gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1vdmUsIGVsZW0pOyB9XG4gICAgZWxzZXtcbiAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShhbmltKTtcbiAgICAgIGVsZW0udHJpZ2dlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSkudHJpZ2dlckhhbmRsZXIoJ2ZpbmlzaGVkLnpmLmFuaW1hdGUnLCBbZWxlbV0pO1xuICAgIH1cbiAgfVxuICBhbmltID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShtb3ZlKTtcbn1cblxuLyoqXG4gKiBBbmltYXRlcyBhbiBlbGVtZW50IGluIG9yIG91dCB1c2luZyBhIENTUyB0cmFuc2l0aW9uIGNsYXNzLlxuICogQGZ1bmN0aW9uXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtCb29sZWFufSBpc0luIC0gRGVmaW5lcyBpZiB0aGUgYW5pbWF0aW9uIGlzIGluIG9yIG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9yIEhUTUwgb2JqZWN0IHRvIGFuaW1hdGUuXG4gKiBAcGFyYW0ge1N0cmluZ30gYW5pbWF0aW9uIC0gQ1NTIGNsYXNzIHRvIHVzZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gQ2FsbGJhY2sgdG8gcnVuIHdoZW4gYW5pbWF0aW9uIGlzIGZpbmlzaGVkLlxuICovXG5mdW5jdGlvbiBhbmltYXRlKGlzSW4sIGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcbiAgZWxlbWVudCA9ICQoZWxlbWVudCkuZXEoMCk7XG5cbiAgaWYgKCFlbGVtZW50Lmxlbmd0aCkgcmV0dXJuO1xuXG4gIHZhciBpbml0Q2xhc3MgPSBpc0luID8gaW5pdENsYXNzZXNbMF0gOiBpbml0Q2xhc3Nlc1sxXTtcbiAgdmFyIGFjdGl2ZUNsYXNzID0gaXNJbiA/IGFjdGl2ZUNsYXNzZXNbMF0gOiBhY3RpdmVDbGFzc2VzWzFdO1xuXG4gIC8vIFNldCB1cCB0aGUgYW5pbWF0aW9uXG4gIHJlc2V0KCk7XG5cbiAgZWxlbWVudFxuICAgIC5hZGRDbGFzcyhhbmltYXRpb24pXG4gICAgLmNzcygndHJhbnNpdGlvbicsICdub25lJyk7XG5cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICBlbGVtZW50LmFkZENsYXNzKGluaXRDbGFzcyk7XG4gICAgaWYgKGlzSW4pIGVsZW1lbnQuc2hvdygpO1xuICB9KTtcblxuICAvLyBTdGFydCB0aGUgYW5pbWF0aW9uXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgZWxlbWVudFswXS5vZmZzZXRXaWR0aDtcbiAgICBlbGVtZW50XG4gICAgICAuY3NzKCd0cmFuc2l0aW9uJywgJycpXG4gICAgICAuYWRkQ2xhc3MoYWN0aXZlQ2xhc3MpO1xuICB9KTtcblxuICAvLyBDbGVhbiB1cCB0aGUgYW5pbWF0aW9uIHdoZW4gaXQgZmluaXNoZXNcbiAgZWxlbWVudC5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKGVsZW1lbnQpLCBmaW5pc2gpO1xuXG4gIC8vIEhpZGVzIHRoZSBlbGVtZW50IChmb3Igb3V0IGFuaW1hdGlvbnMpLCByZXNldHMgdGhlIGVsZW1lbnQsIGFuZCBydW5zIGEgY2FsbGJhY2tcbiAgZnVuY3Rpb24gZmluaXNoKCkge1xuICAgIGlmICghaXNJbikgZWxlbWVudC5oaWRlKCk7XG4gICAgcmVzZXQoKTtcbiAgICBpZiAoY2IpIGNiLmFwcGx5KGVsZW1lbnQpO1xuICB9XG5cbiAgLy8gUmVzZXRzIHRyYW5zaXRpb25zIGFuZCByZW1vdmVzIG1vdGlvbi1zcGVjaWZpYyBjbGFzc2VzXG4gIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgIGVsZW1lbnRbMF0uc3R5bGUudHJhbnNpdGlvbkR1cmF0aW9uID0gMDtcbiAgICBlbGVtZW50LnJlbW92ZUNsYXNzKGAke2luaXRDbGFzc30gJHthY3RpdmVDbGFzc30gJHthbmltYXRpb259YCk7XG4gIH1cbn1cblxuRm91bmRhdGlvbi5Nb3ZlID0gTW92ZTtcbkZvdW5kYXRpb24uTW90aW9uID0gTW90aW9uO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbmNvbnN0IE5lc3QgPSB7XG4gIEZlYXRoZXIobWVudSwgdHlwZSA9ICd6ZicpIHtcbiAgICBtZW51LmF0dHIoJ3JvbGUnLCAnbWVudWJhcicpO1xuXG4gICAgdmFyIGl0ZW1zID0gbWVudS5maW5kKCdsaScpLmF0dHIoeydyb2xlJzogJ21lbnVpdGVtJ30pLFxuICAgICAgICBzdWJNZW51Q2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51YCxcbiAgICAgICAgc3ViSXRlbUNsYXNzID0gYCR7c3ViTWVudUNsYXNzfS1pdGVtYCxcbiAgICAgICAgaGFzU3ViQ2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51LXBhcmVudGA7XG5cbiAgICBtZW51LmZpbmQoJ2E6Zmlyc3QnKS5hdHRyKCd0YWJpbmRleCcsIDApO1xuXG4gICAgaXRlbXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgIHZhciAkaXRlbSA9ICQodGhpcyksXG4gICAgICAgICAgJHN1YiA9ICRpdGVtLmNoaWxkcmVuKCd1bCcpO1xuXG4gICAgICBpZiAoJHN1Yi5sZW5ndGgpIHtcbiAgICAgICAgJGl0ZW1cbiAgICAgICAgICAuYWRkQ2xhc3MoaGFzU3ViQ2xhc3MpXG4gICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgJ2FyaWEtaGFzcG9wdXAnOiB0cnVlLFxuICAgICAgICAgICAgJ2FyaWEtZXhwYW5kZWQnOiBmYWxzZSxcbiAgICAgICAgICAgICdhcmlhLWxhYmVsJzogJGl0ZW0uY2hpbGRyZW4oJ2E6Zmlyc3QnKS50ZXh0KClcbiAgICAgICAgICB9KTtcblxuICAgICAgICAkc3ViXG4gICAgICAgICAgLmFkZENsYXNzKGBzdWJtZW51ICR7c3ViTWVudUNsYXNzfWApXG4gICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgJ2RhdGEtc3VibWVudSc6ICcnLFxuICAgICAgICAgICAgJ2FyaWEtaGlkZGVuJzogdHJ1ZSxcbiAgICAgICAgICAgICdyb2xlJzogJ21lbnUnXG4gICAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICgkaXRlbS5wYXJlbnQoJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKSB7XG4gICAgICAgICRpdGVtLmFkZENsYXNzKGBpcy1zdWJtZW51LWl0ZW0gJHtzdWJJdGVtQ2xhc3N9YCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm47XG4gIH0sXG5cbiAgQnVybihtZW51LCB0eXBlKSB7XG4gICAgdmFyIGl0ZW1zID0gbWVudS5maW5kKCdsaScpLnJlbW92ZUF0dHIoJ3RhYmluZGV4JyksXG4gICAgICAgIHN1Yk1lbnVDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnVgLFxuICAgICAgICBzdWJJdGVtQ2xhc3MgPSBgJHtzdWJNZW51Q2xhc3N9LWl0ZW1gLFxuICAgICAgICBoYXNTdWJDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnUtcGFyZW50YDtcblxuICAgIG1lbnVcbiAgICAgIC5maW5kKCcqJylcbiAgICAgIC5yZW1vdmVDbGFzcyhgJHtzdWJNZW51Q2xhc3N9ICR7c3ViSXRlbUNsYXNzfSAke2hhc1N1YkNsYXNzfSBpcy1zdWJtZW51LWl0ZW0gc3VibWVudSBpcy1hY3RpdmVgKVxuICAgICAgLnJlbW92ZUF0dHIoJ2RhdGEtc3VibWVudScpLmNzcygnZGlzcGxheScsICcnKTtcblxuICAgIC8vIGNvbnNvbGUubG9nKCAgICAgIG1lbnUuZmluZCgnLicgKyBzdWJNZW51Q2xhc3MgKyAnLCAuJyArIHN1Ykl0ZW1DbGFzcyArICcsIC5oYXMtc3VibWVudSwgLmlzLXN1Ym1lbnUtaXRlbSwgLnN1Ym1lbnUsIFtkYXRhLXN1Ym1lbnVdJylcbiAgICAvLyAgICAgICAgICAgLnJlbW92ZUNsYXNzKHN1Yk1lbnVDbGFzcyArICcgJyArIHN1Ykl0ZW1DbGFzcyArICcgaGFzLXN1Ym1lbnUgaXMtc3VibWVudS1pdGVtIHN1Ym1lbnUnKVxuICAgIC8vICAgICAgICAgICAucmVtb3ZlQXR0cignZGF0YS1zdWJtZW51JykpO1xuICAgIC8vIGl0ZW1zLmVhY2goZnVuY3Rpb24oKXtcbiAgICAvLyAgIHZhciAkaXRlbSA9ICQodGhpcyksXG4gICAgLy8gICAgICAgJHN1YiA9ICRpdGVtLmNoaWxkcmVuKCd1bCcpO1xuICAgIC8vICAgaWYoJGl0ZW0ucGFyZW50KCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCl7XG4gICAgLy8gICAgICRpdGVtLnJlbW92ZUNsYXNzKCdpcy1zdWJtZW51LWl0ZW0gJyArIHN1Ykl0ZW1DbGFzcyk7XG4gICAgLy8gICB9XG4gICAgLy8gICBpZigkc3ViLmxlbmd0aCl7XG4gICAgLy8gICAgICRpdGVtLnJlbW92ZUNsYXNzKCdoYXMtc3VibWVudScpO1xuICAgIC8vICAgICAkc3ViLnJlbW92ZUNsYXNzKCdzdWJtZW51ICcgKyBzdWJNZW51Q2xhc3MpLnJlbW92ZUF0dHIoJ2RhdGEtc3VibWVudScpO1xuICAgIC8vICAgfVxuICAgIC8vIH0pO1xuICB9XG59XG5cbkZvdW5kYXRpb24uTmVzdCA9IE5lc3Q7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuZnVuY3Rpb24gVGltZXIoZWxlbSwgb3B0aW9ucywgY2IpIHtcbiAgdmFyIF90aGlzID0gdGhpcyxcbiAgICAgIGR1cmF0aW9uID0gb3B0aW9ucy5kdXJhdGlvbiwvL29wdGlvbnMgaXMgYW4gb2JqZWN0IGZvciBlYXNpbHkgYWRkaW5nIGZlYXR1cmVzIGxhdGVyLlxuICAgICAgbmFtZVNwYWNlID0gT2JqZWN0LmtleXMoZWxlbS5kYXRhKCkpWzBdIHx8ICd0aW1lcicsXG4gICAgICByZW1haW4gPSAtMSxcbiAgICAgIHN0YXJ0LFxuICAgICAgdGltZXI7XG5cbiAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xuXG4gIHRoaXMucmVzdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIHJlbWFpbiA9IC0xO1xuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgdGhpcy5zdGFydCgpO1xuICB9XG5cbiAgdGhpcy5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcbiAgICAvLyBpZighZWxlbS5kYXRhKCdwYXVzZWQnKSl7IHJldHVybiBmYWxzZTsgfS8vbWF5YmUgaW1wbGVtZW50IHRoaXMgc2FuaXR5IGNoZWNrIGlmIHVzZWQgZm9yIG90aGVyIHRoaW5ncy5cbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIHJlbWFpbiA9IHJlbWFpbiA8PSAwID8gZHVyYXRpb24gOiByZW1haW47XG4gICAgZWxlbS5kYXRhKCdwYXVzZWQnLCBmYWxzZSk7XG4gICAgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgaWYob3B0aW9ucy5pbmZpbml0ZSl7XG4gICAgICAgIF90aGlzLnJlc3RhcnQoKTsvL3JlcnVuIHRoZSB0aW1lci5cbiAgICAgIH1cbiAgICAgIGNiKCk7XG4gICAgfSwgcmVtYWluKTtcbiAgICBlbGVtLnRyaWdnZXIoYHRpbWVyc3RhcnQuemYuJHtuYW1lU3BhY2V9YCk7XG4gIH1cblxuICB0aGlzLnBhdXNlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XG4gICAgLy9pZihlbGVtLmRhdGEoJ3BhdXNlZCcpKXsgcmV0dXJuIGZhbHNlOyB9Ly9tYXliZSBpbXBsZW1lbnQgdGhpcyBzYW5pdHkgY2hlY2sgaWYgdXNlZCBmb3Igb3RoZXIgdGhpbmdzLlxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgZWxlbS5kYXRhKCdwYXVzZWQnLCB0cnVlKTtcbiAgICB2YXIgZW5kID0gRGF0ZS5ub3coKTtcbiAgICByZW1haW4gPSByZW1haW4gLSAoZW5kIC0gc3RhcnQpO1xuICAgIGVsZW0udHJpZ2dlcihgdGltZXJwYXVzZWQuemYuJHtuYW1lU3BhY2V9YCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSdW5zIGEgY2FsbGJhY2sgZnVuY3Rpb24gd2hlbiBpbWFnZXMgYXJlIGZ1bGx5IGxvYWRlZC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbWFnZXMgLSBJbWFnZShzKSB0byBjaGVjayBpZiBsb2FkZWQuXG4gKiBAcGFyYW0ge0Z1bmN9IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIGltYWdlIGlzIGZ1bGx5IGxvYWRlZC5cbiAqL1xuZnVuY3Rpb24gb25JbWFnZXNMb2FkZWQoaW1hZ2VzLCBjYWxsYmFjayl7XG4gIHZhciBzZWxmID0gdGhpcyxcbiAgICAgIHVubG9hZGVkID0gaW1hZ2VzLmxlbmd0aDtcblxuICBpZiAodW5sb2FkZWQgPT09IDApIHtcbiAgICBjYWxsYmFjaygpO1xuICB9XG5cbiAgaW1hZ2VzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuY29tcGxldGUpIHtcbiAgICAgIHNpbmdsZUltYWdlTG9hZGVkKCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiB0aGlzLm5hdHVyYWxXaWR0aCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5uYXR1cmFsV2lkdGggPiAwKSB7XG4gICAgICBzaW5nbGVJbWFnZUxvYWRlZCgpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICQodGhpcykub25lKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHNpbmdsZUltYWdlTG9hZGVkKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIHNpbmdsZUltYWdlTG9hZGVkKCkge1xuICAgIHVubG9hZGVkLS07XG4gICAgaWYgKHVubG9hZGVkID09PSAwKSB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH1cbiAgfVxufVxuXG5Gb3VuZGF0aW9uLlRpbWVyID0gVGltZXI7XG5Gb3VuZGF0aW9uLm9uSW1hZ2VzTG9hZGVkID0gb25JbWFnZXNMb2FkZWQ7XG5cbn0oalF1ZXJ5KTtcbiIsIi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbi8vKipXb3JrIGluc3BpcmVkIGJ5IG11bHRpcGxlIGpxdWVyeSBzd2lwZSBwbHVnaW5zKipcbi8vKipEb25lIGJ5IFlvaGFpIEFyYXJhdCAqKioqKioqKioqKioqKioqKioqKioqKioqKipcbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbihmdW5jdGlvbigkKSB7XG5cbiAgJC5zcG90U3dpcGUgPSB7XG4gICAgdmVyc2lvbjogJzEuMC4wJyxcbiAgICBlbmFibGVkOiAnb250b3VjaHN0YXJ0JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsXG4gICAgcHJldmVudERlZmF1bHQ6IGZhbHNlLFxuICAgIG1vdmVUaHJlc2hvbGQ6IDc1LFxuICAgIHRpbWVUaHJlc2hvbGQ6IDIwMFxuICB9O1xuXG4gIHZhciAgIHN0YXJ0UG9zWCxcbiAgICAgICAgc3RhcnRQb3NZLFxuICAgICAgICBzdGFydFRpbWUsXG4gICAgICAgIGVsYXBzZWRUaW1lLFxuICAgICAgICBpc01vdmluZyA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIG9uVG91Y2hFbmQoKSB7XG4gICAgLy8gIGFsZXJ0KHRoaXMpO1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgb25Ub3VjaE1vdmUpO1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRvdWNoRW5kKTtcbiAgICBpc01vdmluZyA9IGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gb25Ub3VjaE1vdmUoZSkge1xuICAgIGlmICgkLnNwb3RTd2lwZS5wcmV2ZW50RGVmYXVsdCkgeyBlLnByZXZlbnREZWZhdWx0KCk7IH1cbiAgICBpZihpc01vdmluZykge1xuICAgICAgdmFyIHggPSBlLnRvdWNoZXNbMF0ucGFnZVg7XG4gICAgICB2YXIgeSA9IGUudG91Y2hlc1swXS5wYWdlWTtcbiAgICAgIHZhciBkeCA9IHN0YXJ0UG9zWCAtIHg7XG4gICAgICB2YXIgZHkgPSBzdGFydFBvc1kgLSB5O1xuICAgICAgdmFyIGRpcjtcbiAgICAgIGVsYXBzZWRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWU7XG4gICAgICBpZihNYXRoLmFicyhkeCkgPj0gJC5zcG90U3dpcGUubW92ZVRocmVzaG9sZCAmJiBlbGFwc2VkVGltZSA8PSAkLnNwb3RTd2lwZS50aW1lVGhyZXNob2xkKSB7XG4gICAgICAgIGRpciA9IGR4ID4gMCA/ICdsZWZ0JyA6ICdyaWdodCc7XG4gICAgICB9XG4gICAgICAvLyBlbHNlIGlmKE1hdGguYWJzKGR5KSA+PSAkLnNwb3RTd2lwZS5tb3ZlVGhyZXNob2xkICYmIGVsYXBzZWRUaW1lIDw9ICQuc3BvdFN3aXBlLnRpbWVUaHJlc2hvbGQpIHtcbiAgICAgIC8vICAgZGlyID0gZHkgPiAwID8gJ2Rvd24nIDogJ3VwJztcbiAgICAgIC8vIH1cbiAgICAgIGlmKGRpcikge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIG9uVG91Y2hFbmQuY2FsbCh0aGlzKTtcbiAgICAgICAgJCh0aGlzKS50cmlnZ2VyKCdzd2lwZScsIGRpcikudHJpZ2dlcihgc3dpcGUke2Rpcn1gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBvblRvdWNoU3RhcnQoZSkge1xuICAgIGlmIChlLnRvdWNoZXMubGVuZ3RoID09IDEpIHtcbiAgICAgIHN0YXJ0UG9zWCA9IGUudG91Y2hlc1swXS5wYWdlWDtcbiAgICAgIHN0YXJ0UG9zWSA9IGUudG91Y2hlc1swXS5wYWdlWTtcbiAgICAgIGlzTW92aW5nID0gdHJ1ZTtcbiAgICAgIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSwgZmFsc2UpO1xuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uVG91Y2hFbmQsIGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpbml0KCkge1xuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lciAmJiB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBvblRvdWNoU3RhcnQsIGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCk7XG4gIH1cblxuICAkLmV2ZW50LnNwZWNpYWwuc3dpcGUgPSB7IHNldHVwOiBpbml0IH07XG5cbiAgJC5lYWNoKFsnbGVmdCcsICd1cCcsICdkb3duJywgJ3JpZ2h0J10sIGZ1bmN0aW9uICgpIHtcbiAgICAkLmV2ZW50LnNwZWNpYWxbYHN3aXBlJHt0aGlzfWBdID0geyBzZXR1cDogZnVuY3Rpb24oKXtcbiAgICAgICQodGhpcykub24oJ3N3aXBlJywgJC5ub29wKTtcbiAgICB9IH07XG4gIH0pO1xufSkoalF1ZXJ5KTtcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBNZXRob2QgZm9yIGFkZGluZyBwc3VlZG8gZHJhZyBldmVudHMgdG8gZWxlbWVudHMgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbiFmdW5jdGlvbigkKXtcbiAgJC5mbi5hZGRUb3VjaCA9IGZ1bmN0aW9uKCl7XG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGksZWwpe1xuICAgICAgJChlbCkuYmluZCgndG91Y2hzdGFydCB0b3VjaG1vdmUgdG91Y2hlbmQgdG91Y2hjYW5jZWwnLGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vd2UgcGFzcyB0aGUgb3JpZ2luYWwgZXZlbnQgb2JqZWN0IGJlY2F1c2UgdGhlIGpRdWVyeSBldmVudFxuICAgICAgICAvL29iamVjdCBpcyBub3JtYWxpemVkIHRvIHczYyBzcGVjcyBhbmQgZG9lcyBub3QgcHJvdmlkZSB0aGUgVG91Y2hMaXN0XG4gICAgICAgIGhhbmRsZVRvdWNoKGV2ZW50KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdmFyIGhhbmRsZVRvdWNoID0gZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgdmFyIHRvdWNoZXMgPSBldmVudC5jaGFuZ2VkVG91Y2hlcyxcbiAgICAgICAgICBmaXJzdCA9IHRvdWNoZXNbMF0sXG4gICAgICAgICAgZXZlbnRUeXBlcyA9IHtcbiAgICAgICAgICAgIHRvdWNoc3RhcnQ6ICdtb3VzZWRvd24nLFxuICAgICAgICAgICAgdG91Y2htb3ZlOiAnbW91c2Vtb3ZlJyxcbiAgICAgICAgICAgIHRvdWNoZW5kOiAnbW91c2V1cCdcbiAgICAgICAgICB9LFxuICAgICAgICAgIHR5cGUgPSBldmVudFR5cGVzW2V2ZW50LnR5cGVdLFxuICAgICAgICAgIHNpbXVsYXRlZEV2ZW50XG4gICAgICAgIDtcblxuICAgICAgaWYoJ01vdXNlRXZlbnQnIGluIHdpbmRvdyAmJiB0eXBlb2Ygd2luZG93Lk1vdXNlRXZlbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgc2ltdWxhdGVkRXZlbnQgPSB3aW5kb3cuTW91c2VFdmVudCh0eXBlLCB7XG4gICAgICAgICAgJ2J1YmJsZXMnOiB0cnVlLFxuICAgICAgICAgICdjYW5jZWxhYmxlJzogdHJ1ZSxcbiAgICAgICAgICAnc2NyZWVuWCc6IGZpcnN0LnNjcmVlblgsXG4gICAgICAgICAgJ3NjcmVlblknOiBmaXJzdC5zY3JlZW5ZLFxuICAgICAgICAgICdjbGllbnRYJzogZmlyc3QuY2xpZW50WCxcbiAgICAgICAgICAnY2xpZW50WSc6IGZpcnN0LmNsaWVudFlcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaW11bGF0ZWRFdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50Jyk7XG4gICAgICAgIHNpbXVsYXRlZEV2ZW50LmluaXRNb3VzZUV2ZW50KHR5cGUsIHRydWUsIHRydWUsIHdpbmRvdywgMSwgZmlyc3Quc2NyZWVuWCwgZmlyc3Quc2NyZWVuWSwgZmlyc3QuY2xpZW50WCwgZmlyc3QuY2xpZW50WSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIDAvKmxlZnQqLywgbnVsbCk7XG4gICAgICB9XG4gICAgICBmaXJzdC50YXJnZXQuZGlzcGF0Y2hFdmVudChzaW11bGF0ZWRFdmVudCk7XG4gICAgfTtcbiAgfTtcbn0oalF1ZXJ5KTtcblxuXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbi8vKipGcm9tIHRoZSBqUXVlcnkgTW9iaWxlIExpYnJhcnkqKlxuLy8qKm5lZWQgdG8gcmVjcmVhdGUgZnVuY3Rpb25hbGl0eSoqXG4vLyoqYW5kIHRyeSB0byBpbXByb3ZlIGlmIHBvc3NpYmxlKipcbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4vKiBSZW1vdmluZyB0aGUgalF1ZXJ5IGZ1bmN0aW9uICoqKipcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4oZnVuY3Rpb24oICQsIHdpbmRvdywgdW5kZWZpbmVkICkge1xuXG5cdHZhciAkZG9jdW1lbnQgPSAkKCBkb2N1bWVudCApLFxuXHRcdC8vIHN1cHBvcnRUb3VjaCA9ICQubW9iaWxlLnN1cHBvcnQudG91Y2gsXG5cdFx0dG91Y2hTdGFydEV2ZW50ID0gJ3RvdWNoc3RhcnQnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNoc3RhcnRcIiA6IFwibW91c2Vkb3duXCIsXG5cdFx0dG91Y2hTdG9wRXZlbnQgPSAndG91Y2hlbmQnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNoZW5kXCIgOiBcIm1vdXNldXBcIixcblx0XHR0b3VjaE1vdmVFdmVudCA9ICd0b3VjaG1vdmUnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNobW92ZVwiIDogXCJtb3VzZW1vdmVcIjtcblxuXHQvLyBzZXR1cCBuZXcgZXZlbnQgc2hvcnRjdXRzXG5cdCQuZWFjaCggKCBcInRvdWNoc3RhcnQgdG91Y2htb3ZlIHRvdWNoZW5kIFwiICtcblx0XHRcInN3aXBlIHN3aXBlbGVmdCBzd2lwZXJpZ2h0XCIgKS5zcGxpdCggXCIgXCIgKSwgZnVuY3Rpb24oIGksIG5hbWUgKSB7XG5cblx0XHQkLmZuWyBuYW1lIF0gPSBmdW5jdGlvbiggZm4gKSB7XG5cdFx0XHRyZXR1cm4gZm4gPyB0aGlzLmJpbmQoIG5hbWUsIGZuICkgOiB0aGlzLnRyaWdnZXIoIG5hbWUgKTtcblx0XHR9O1xuXG5cdFx0Ly8galF1ZXJ5IDwgMS44XG5cdFx0aWYgKCAkLmF0dHJGbiApIHtcblx0XHRcdCQuYXR0ckZuWyBuYW1lIF0gPSB0cnVlO1xuXHRcdH1cblx0fSk7XG5cblx0ZnVuY3Rpb24gdHJpZ2dlckN1c3RvbUV2ZW50KCBvYmosIGV2ZW50VHlwZSwgZXZlbnQsIGJ1YmJsZSApIHtcblx0XHR2YXIgb3JpZ2luYWxUeXBlID0gZXZlbnQudHlwZTtcblx0XHRldmVudC50eXBlID0gZXZlbnRUeXBlO1xuXHRcdGlmICggYnViYmxlICkge1xuXHRcdFx0JC5ldmVudC50cmlnZ2VyKCBldmVudCwgdW5kZWZpbmVkLCBvYmogKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0JC5ldmVudC5kaXNwYXRjaC5jYWxsKCBvYmosIGV2ZW50ICk7XG5cdFx0fVxuXHRcdGV2ZW50LnR5cGUgPSBvcmlnaW5hbFR5cGU7XG5cdH1cblxuXHQvLyBhbHNvIGhhbmRsZXMgdGFwaG9sZFxuXG5cdC8vIEFsc28gaGFuZGxlcyBzd2lwZWxlZnQsIHN3aXBlcmlnaHRcblx0JC5ldmVudC5zcGVjaWFsLnN3aXBlID0ge1xuXG5cdFx0Ly8gTW9yZSB0aGFuIHRoaXMgaG9yaXpvbnRhbCBkaXNwbGFjZW1lbnQsIGFuZCB3ZSB3aWxsIHN1cHByZXNzIHNjcm9sbGluZy5cblx0XHRzY3JvbGxTdXByZXNzaW9uVGhyZXNob2xkOiAzMCxcblxuXHRcdC8vIE1vcmUgdGltZSB0aGFuIHRoaXMsIGFuZCBpdCBpc24ndCBhIHN3aXBlLlxuXHRcdGR1cmF0aW9uVGhyZXNob2xkOiAxMDAwLFxuXG5cdFx0Ly8gU3dpcGUgaG9yaXpvbnRhbCBkaXNwbGFjZW1lbnQgbXVzdCBiZSBtb3JlIHRoYW4gdGhpcy5cblx0XHRob3Jpem9udGFsRGlzdGFuY2VUaHJlc2hvbGQ6IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID49IDIgPyAxNSA6IDMwLFxuXG5cdFx0Ly8gU3dpcGUgdmVydGljYWwgZGlzcGxhY2VtZW50IG11c3QgYmUgbGVzcyB0aGFuIHRoaXMuXG5cdFx0dmVydGljYWxEaXN0YW5jZVRocmVzaG9sZDogd2luZG93LmRldmljZVBpeGVsUmF0aW8gPj0gMiA/IDE1IDogMzAsXG5cblx0XHRnZXRMb2NhdGlvbjogZnVuY3Rpb24gKCBldmVudCApIHtcblx0XHRcdHZhciB3aW5QYWdlWCA9IHdpbmRvdy5wYWdlWE9mZnNldCxcblx0XHRcdFx0d2luUGFnZVkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXG5cdFx0XHRcdHggPSBldmVudC5jbGllbnRYLFxuXHRcdFx0XHR5ID0gZXZlbnQuY2xpZW50WTtcblxuXHRcdFx0aWYgKCBldmVudC5wYWdlWSA9PT0gMCAmJiBNYXRoLmZsb29yKCB5ICkgPiBNYXRoLmZsb29yKCBldmVudC5wYWdlWSApIHx8XG5cdFx0XHRcdGV2ZW50LnBhZ2VYID09PSAwICYmIE1hdGguZmxvb3IoIHggKSA+IE1hdGguZmxvb3IoIGV2ZW50LnBhZ2VYICkgKSB7XG5cblx0XHRcdFx0Ly8gaU9TNCBjbGllbnRYL2NsaWVudFkgaGF2ZSB0aGUgdmFsdWUgdGhhdCBzaG91bGQgaGF2ZSBiZWVuXG5cdFx0XHRcdC8vIGluIHBhZ2VYL3BhZ2VZLiBXaGlsZSBwYWdlWC9wYWdlLyBoYXZlIHRoZSB2YWx1ZSAwXG5cdFx0XHRcdHggPSB4IC0gd2luUGFnZVg7XG5cdFx0XHRcdHkgPSB5IC0gd2luUGFnZVk7XG5cdFx0XHR9IGVsc2UgaWYgKCB5IDwgKCBldmVudC5wYWdlWSAtIHdpblBhZ2VZKSB8fCB4IDwgKCBldmVudC5wYWdlWCAtIHdpblBhZ2VYICkgKSB7XG5cblx0XHRcdFx0Ly8gU29tZSBBbmRyb2lkIGJyb3dzZXJzIGhhdmUgdG90YWxseSBib2d1cyB2YWx1ZXMgZm9yIGNsaWVudFgvWVxuXHRcdFx0XHQvLyB3aGVuIHNjcm9sbGluZy96b29taW5nIGEgcGFnZS4gRGV0ZWN0YWJsZSBzaW5jZSBjbGllbnRYL2NsaWVudFlcblx0XHRcdFx0Ly8gc2hvdWxkIG5ldmVyIGJlIHNtYWxsZXIgdGhhbiBwYWdlWC9wYWdlWSBtaW51cyBwYWdlIHNjcm9sbFxuXHRcdFx0XHR4ID0gZXZlbnQucGFnZVggLSB3aW5QYWdlWDtcblx0XHRcdFx0eSA9IGV2ZW50LnBhZ2VZIC0gd2luUGFnZVk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHg6IHgsXG5cdFx0XHRcdHk6IHlcblx0XHRcdH07XG5cdFx0fSxcblxuXHRcdHN0YXJ0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHR2YXIgZGF0YSA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlcyA/XG5cdFx0XHRcdFx0ZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzWyAwIF0gOiBldmVudCxcblx0XHRcdFx0bG9jYXRpb24gPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZ2V0TG9jYXRpb24oIGRhdGEgKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHR0aW1lOiAoIG5ldyBEYXRlKCkgKS5nZXRUaW1lKCksXG5cdFx0XHRcdFx0XHRjb29yZHM6IFsgbG9jYXRpb24ueCwgbG9jYXRpb24ueSBdLFxuXHRcdFx0XHRcdFx0b3JpZ2luOiAkKCBldmVudC50YXJnZXQgKVxuXHRcdFx0XHRcdH07XG5cdFx0fSxcblxuXHRcdHN0b3A6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdHZhciBkYXRhID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzID9cblx0XHRcdFx0XHRldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbIDAgXSA6IGV2ZW50LFxuXHRcdFx0XHRsb2NhdGlvbiA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5nZXRMb2NhdGlvbiggZGF0YSApO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHRpbWU6ICggbmV3IERhdGUoKSApLmdldFRpbWUoKSxcblx0XHRcdFx0XHRcdGNvb3JkczogWyBsb2NhdGlvbi54LCBsb2NhdGlvbi55IF1cblx0XHRcdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRoYW5kbGVTd2lwZTogZnVuY3Rpb24oIHN0YXJ0LCBzdG9wLCB0aGlzT2JqZWN0LCBvcmlnVGFyZ2V0ICkge1xuXHRcdFx0aWYgKCBzdG9wLnRpbWUgLSBzdGFydC50aW1lIDwgJC5ldmVudC5zcGVjaWFsLnN3aXBlLmR1cmF0aW9uVGhyZXNob2xkICYmXG5cdFx0XHRcdE1hdGguYWJzKCBzdGFydC5jb29yZHNbIDAgXSAtIHN0b3AuY29vcmRzWyAwIF0gKSA+ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ob3Jpem9udGFsRGlzdGFuY2VUaHJlc2hvbGQgJiZcblx0XHRcdFx0TWF0aC5hYnMoIHN0YXJ0LmNvb3Jkc1sgMSBdIC0gc3RvcC5jb29yZHNbIDEgXSApIDwgJC5ldmVudC5zcGVjaWFsLnN3aXBlLnZlcnRpY2FsRGlzdGFuY2VUaHJlc2hvbGQgKSB7XG5cdFx0XHRcdHZhciBkaXJlY3Rpb24gPSBzdGFydC5jb29yZHNbMF0gPiBzdG9wLmNvb3Jkc1sgMCBdID8gXCJzd2lwZWxlZnRcIiA6IFwic3dpcGVyaWdodFwiO1xuXG5cdFx0XHRcdHRyaWdnZXJDdXN0b21FdmVudCggdGhpc09iamVjdCwgXCJzd2lwZVwiLCAkLkV2ZW50KCBcInN3aXBlXCIsIHsgdGFyZ2V0OiBvcmlnVGFyZ2V0LCBzd2lwZXN0YXJ0OiBzdGFydCwgc3dpcGVzdG9wOiBzdG9wIH0pLCB0cnVlICk7XG5cdFx0XHRcdHRyaWdnZXJDdXN0b21FdmVudCggdGhpc09iamVjdCwgZGlyZWN0aW9uLCQuRXZlbnQoIGRpcmVjdGlvbiwgeyB0YXJnZXQ6IG9yaWdUYXJnZXQsIHN3aXBlc3RhcnQ6IHN0YXJ0LCBzd2lwZXN0b3A6IHN0b3AgfSApLCB0cnVlICk7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXG5cdFx0fSxcblxuXHRcdC8vIFRoaXMgc2VydmVzIGFzIGEgZmxhZyB0byBlbnN1cmUgdGhhdCBhdCBtb3N0IG9uZSBzd2lwZSBldmVudCBldmVudCBpc1xuXHRcdC8vIGluIHdvcmsgYXQgYW55IGdpdmVuIHRpbWVcblx0XHRldmVudEluUHJvZ3Jlc3M6IGZhbHNlLFxuXG5cdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGV2ZW50cyxcblx0XHRcdFx0dGhpc09iamVjdCA9IHRoaXMsXG5cdFx0XHRcdCR0aGlzID0gJCggdGhpc09iamVjdCApLFxuXHRcdFx0XHRjb250ZXh0ID0ge307XG5cblx0XHRcdC8vIFJldHJpZXZlIHRoZSBldmVudHMgZGF0YSBmb3IgdGhpcyBlbGVtZW50IGFuZCBhZGQgdGhlIHN3aXBlIGNvbnRleHRcblx0XHRcdGV2ZW50cyA9ICQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcblx0XHRcdGlmICggIWV2ZW50cyApIHtcblx0XHRcdFx0ZXZlbnRzID0geyBsZW5ndGg6IDAgfTtcblx0XHRcdFx0JC5kYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiwgZXZlbnRzICk7XG5cdFx0XHR9XG5cdFx0XHRldmVudHMubGVuZ3RoKys7XG5cdFx0XHRldmVudHMuc3dpcGUgPSBjb250ZXh0O1xuXG5cdFx0XHRjb250ZXh0LnN0YXJ0ID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuXG5cdFx0XHRcdC8vIEJhaWwgaWYgd2UncmUgYWxyZWFkeSB3b3JraW5nIG9uIGEgc3dpcGUgZXZlbnRcblx0XHRcdFx0aWYgKCAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzICkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gdHJ1ZTtcblxuXHRcdFx0XHR2YXIgc3RvcCxcblx0XHRcdFx0XHRzdGFydCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdGFydCggZXZlbnQgKSxcblx0XHRcdFx0XHRvcmlnVGFyZ2V0ID0gZXZlbnQudGFyZ2V0LFxuXHRcdFx0XHRcdGVtaXR0ZWQgPSBmYWxzZTtcblxuXHRcdFx0XHRjb250ZXh0Lm1vdmUgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHRcdFx0aWYgKCAhc3RhcnQgfHwgZXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkgKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c3RvcCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdG9wKCBldmVudCApO1xuXHRcdFx0XHRcdGlmICggIWVtaXR0ZWQgKSB7XG5cdFx0XHRcdFx0XHRlbWl0dGVkID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmhhbmRsZVN3aXBlKCBzdGFydCwgc3RvcCwgdGhpc09iamVjdCwgb3JpZ1RhcmdldCApO1xuXHRcdFx0XHRcdFx0aWYgKCBlbWl0dGVkICkge1xuXG5cdFx0XHRcdFx0XHRcdC8vIFJlc2V0IHRoZSBjb250ZXh0IHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzd2lwZSBldmVudFxuXHRcdFx0XHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIHByZXZlbnQgc2Nyb2xsaW5nXG5cdFx0XHRcdFx0aWYgKCBNYXRoLmFicyggc3RhcnQuY29vcmRzWyAwIF0gLSBzdG9wLmNvb3Jkc1sgMCBdICkgPiAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuc2Nyb2xsU3VwcmVzc2lvblRocmVzaG9sZCApIHtcblx0XHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGNvbnRleHQuc3RvcCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0ZW1pdHRlZCA9IHRydWU7XG5cblx0XHRcdFx0XHRcdC8vIFJlc2V0IHRoZSBjb250ZXh0IHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzd2lwZSBldmVudFxuXHRcdFx0XHRcdFx0JC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApO1xuXHRcdFx0XHRcdFx0Y29udGV4dC5tb3ZlID0gbnVsbDtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkZG9jdW1lbnQub24oIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKVxuXHRcdFx0XHRcdC5vbmUoIHRvdWNoU3RvcEV2ZW50LCBjb250ZXh0LnN0b3AgKTtcblx0XHRcdH07XG5cdFx0XHQkdGhpcy5vbiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XG5cdFx0fSxcblxuXHRcdHRlYXJkb3duOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBldmVudHMsIGNvbnRleHQ7XG5cblx0XHRcdGV2ZW50cyA9ICQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcblx0XHRcdGlmICggZXZlbnRzICkge1xuXHRcdFx0XHRjb250ZXh0ID0gZXZlbnRzLnN3aXBlO1xuXHRcdFx0XHRkZWxldGUgZXZlbnRzLnN3aXBlO1xuXHRcdFx0XHRldmVudHMubGVuZ3RoLS07XG5cdFx0XHRcdGlmICggZXZlbnRzLmxlbmd0aCA9PT0gMCApIHtcblx0XHRcdFx0XHQkLnJlbW92ZURhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKCBjb250ZXh0ICkge1xuXHRcdFx0XHRpZiAoIGNvbnRleHQuc3RhcnQgKSB7XG5cdFx0XHRcdFx0JCggdGhpcyApLm9mZiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCBjb250ZXh0Lm1vdmUgKSB7XG5cdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggY29udGV4dC5zdG9wICkge1xuXHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoU3RvcEV2ZW50LCBjb250ZXh0LnN0b3AgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblx0JC5lYWNoKHtcblx0XHRzd2lwZWxlZnQ6IFwic3dpcGUubGVmdFwiLFxuXHRcdHN3aXBlcmlnaHQ6IFwic3dpcGUucmlnaHRcIlxuXHR9LCBmdW5jdGlvbiggZXZlbnQsIHNvdXJjZUV2ZW50ICkge1xuXG5cdFx0JC5ldmVudC5zcGVjaWFsWyBldmVudCBdID0ge1xuXHRcdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkKCB0aGlzICkuYmluZCggc291cmNlRXZlbnQsICQubm9vcCApO1xuXHRcdFx0fSxcblx0XHRcdHRlYXJkb3duOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0JCggdGhpcyApLnVuYmluZCggc291cmNlRXZlbnQgKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9KTtcbn0pKCBqUXVlcnksIHRoaXMgKTtcbiovXG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbmNvbnN0IE11dGF0aW9uT2JzZXJ2ZXIgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgcHJlZml4ZXMgPSBbJ1dlYktpdCcsICdNb3onLCAnTycsICdNcycsICcnXTtcbiAgZm9yICh2YXIgaT0wOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoYCR7cHJlZml4ZXNbaV19TXV0YXRpb25PYnNlcnZlcmAgaW4gd2luZG93KSB7XG4gICAgICByZXR1cm4gd2luZG93W2Ake3ByZWZpeGVzW2ldfU11dGF0aW9uT2JzZXJ2ZXJgXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufSgpKTtcblxuY29uc3QgdHJpZ2dlcnMgPSAoZWwsIHR5cGUpID0+IHtcbiAgZWwuZGF0YSh0eXBlKS5zcGxpdCgnICcpLmZvckVhY2goaWQgPT4ge1xuICAgICQoYCMke2lkfWApWyB0eXBlID09PSAnY2xvc2UnID8gJ3RyaWdnZXInIDogJ3RyaWdnZXJIYW5kbGVyJ10oYCR7dHlwZX0uemYudHJpZ2dlcmAsIFtlbF0pO1xuICB9KTtcbn07XG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLW9wZW5dIHdpbGwgcmV2ZWFsIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtb3Blbl0nLCBmdW5jdGlvbigpIHtcbiAgdHJpZ2dlcnMoJCh0aGlzKSwgJ29wZW4nKTtcbn0pO1xuXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLWNsb3NlXSB3aWxsIGNsb3NlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuLy8gSWYgdXNlZCB3aXRob3V0IGEgdmFsdWUgb24gW2RhdGEtY2xvc2VdLCB0aGUgZXZlbnQgd2lsbCBidWJibGUsIGFsbG93aW5nIGl0IHRvIGNsb3NlIGEgcGFyZW50IGNvbXBvbmVudC5cbiQoZG9jdW1lbnQpLm9uKCdjbGljay56Zi50cmlnZ2VyJywgJ1tkYXRhLWNsb3NlXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ2Nsb3NlJyk7XG4gIGlmIChpZCkge1xuICAgIHRyaWdnZXJzKCQodGhpcyksICdjbG9zZScpO1xuICB9XG4gIGVsc2Uge1xuICAgICQodGhpcykudHJpZ2dlcignY2xvc2UuemYudHJpZ2dlcicpO1xuICB9XG59KTtcblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS10b2dnbGVdIHdpbGwgdG9nZ2xlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtdG9nZ2xlXScsIGZ1bmN0aW9uKCkge1xuICB0cmlnZ2VycygkKHRoaXMpLCAndG9nZ2xlJyk7XG59KTtcblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS1jbG9zYWJsZV0gd2lsbCByZXNwb25kIHRvIGNsb3NlLnpmLnRyaWdnZXIgZXZlbnRzLlxuJChkb2N1bWVudCkub24oJ2Nsb3NlLnpmLnRyaWdnZXInLCAnW2RhdGEtY2xvc2FibGVdJywgZnVuY3Rpb24oZSl7XG4gIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIGxldCBhbmltYXRpb24gPSAkKHRoaXMpLmRhdGEoJ2Nsb3NhYmxlJyk7XG5cbiAgaWYoYW5pbWF0aW9uICE9PSAnJyl7XG4gICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCgkKHRoaXMpLCBhbmltYXRpb24sIGZ1bmN0aW9uKCkge1xuICAgICAgJCh0aGlzKS50cmlnZ2VyKCdjbG9zZWQuemYnKTtcbiAgICB9KTtcbiAgfWVsc2V7XG4gICAgJCh0aGlzKS5mYWRlT3V0KCkudHJpZ2dlcignY2xvc2VkLnpmJyk7XG4gIH1cbn0pO1xuXG4kKGRvY3VtZW50KS5vbignZm9jdXMuemYudHJpZ2dlciBibHVyLnpmLnRyaWdnZXInLCAnW2RhdGEtdG9nZ2xlLWZvY3VzXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ3RvZ2dsZS1mb2N1cycpO1xuICAkKGAjJHtpZH1gKS50cmlnZ2VySGFuZGxlcigndG9nZ2xlLnpmLnRyaWdnZXInLCBbJCh0aGlzKV0pO1xufSk7XG5cbi8qKlxuKiBGaXJlcyBvbmNlIGFmdGVyIGFsbCBvdGhlciBzY3JpcHRzIGhhdmUgbG9hZGVkXG4qIEBmdW5jdGlvblxuKiBAcHJpdmF0ZVxuKi9cbiQod2luZG93KS5sb2FkKCgpID0+IHtcbiAgY2hlY2tMaXN0ZW5lcnMoKTtcbn0pO1xuXG5mdW5jdGlvbiBjaGVja0xpc3RlbmVycygpIHtcbiAgZXZlbnRzTGlzdGVuZXIoKTtcbiAgcmVzaXplTGlzdGVuZXIoKTtcbiAgc2Nyb2xsTGlzdGVuZXIoKTtcbiAgY2xvc2VtZUxpc3RlbmVyKCk7XG59XG5cbi8vKioqKioqKiogb25seSBmaXJlcyB0aGlzIGZ1bmN0aW9uIG9uY2Ugb24gbG9hZCwgaWYgdGhlcmUncyBzb21ldGhpbmcgdG8gd2F0Y2ggKioqKioqKipcbmZ1bmN0aW9uIGNsb3NlbWVMaXN0ZW5lcihwbHVnaW5OYW1lKSB7XG4gIHZhciB5ZXRpQm94ZXMgPSAkKCdbZGF0YS15ZXRpLWJveF0nKSxcbiAgICAgIHBsdWdOYW1lcyA9IFsnZHJvcGRvd24nLCAndG9vbHRpcCcsICdyZXZlYWwnXTtcblxuICBpZihwbHVnaW5OYW1lKXtcbiAgICBpZih0eXBlb2YgcGx1Z2luTmFtZSA9PT0gJ3N0cmluZycpe1xuICAgICAgcGx1Z05hbWVzLnB1c2gocGx1Z2luTmFtZSk7XG4gICAgfWVsc2UgaWYodHlwZW9mIHBsdWdpbk5hbWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBwbHVnaW5OYW1lWzBdID09PSAnc3RyaW5nJyl7XG4gICAgICBwbHVnTmFtZXMuY29uY2F0KHBsdWdpbk5hbWUpO1xuICAgIH1lbHNle1xuICAgICAgY29uc29sZS5lcnJvcignUGx1Z2luIG5hbWVzIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgfVxuICBpZih5ZXRpQm94ZXMubGVuZ3RoKXtcbiAgICBsZXQgbGlzdGVuZXJzID0gcGx1Z05hbWVzLm1hcCgobmFtZSkgPT4ge1xuICAgICAgcmV0dXJuIGBjbG9zZW1lLnpmLiR7bmFtZX1gO1xuICAgIH0pLmpvaW4oJyAnKTtcblxuICAgICQod2luZG93KS5vZmYobGlzdGVuZXJzKS5vbihsaXN0ZW5lcnMsIGZ1bmN0aW9uKGUsIHBsdWdpbklkKXtcbiAgICAgIGxldCBwbHVnaW4gPSBlLm5hbWVzcGFjZS5zcGxpdCgnLicpWzBdO1xuICAgICAgbGV0IHBsdWdpbnMgPSAkKGBbZGF0YS0ke3BsdWdpbn1dYCkubm90KGBbZGF0YS15ZXRpLWJveD1cIiR7cGx1Z2luSWR9XCJdYCk7XG5cbiAgICAgIHBsdWdpbnMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICBsZXQgX3RoaXMgPSAkKHRoaXMpO1xuXG4gICAgICAgIF90aGlzLnRyaWdnZXJIYW5kbGVyKCdjbG9zZS56Zi50cmlnZ2VyJywgW190aGlzXSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNpemVMaXN0ZW5lcihkZWJvdW5jZSl7XG4gIGxldCB0aW1lcixcbiAgICAgICRub2RlcyA9ICQoJ1tkYXRhLXJlc2l6ZV0nKTtcbiAgaWYoJG5vZGVzLmxlbmd0aCl7XG4gICAgJCh3aW5kb3cpLm9mZigncmVzaXplLnpmLnRyaWdnZXInKVxuICAgIC5vbigncmVzaXplLnpmLnRyaWdnZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAodGltZXIpIHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxuXG4gICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblxuICAgICAgICBpZighTXV0YXRpb25PYnNlcnZlcil7Ly9mYWxsYmFjayBmb3IgSUUgOVxuICAgICAgICAgICRub2Rlcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAkKHRoaXMpLnRyaWdnZXJIYW5kbGVyKCdyZXNpemVtZS56Zi50cmlnZ2VyJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIHJlc2l6ZSBldmVudFxuICAgICAgICAkbm9kZXMuYXR0cignZGF0YS1ldmVudHMnLCBcInJlc2l6ZVwiKTtcbiAgICAgIH0sIGRlYm91bmNlIHx8IDEwKTsvL2RlZmF1bHQgdGltZSB0byBlbWl0IHJlc2l6ZSBldmVudFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNjcm9sbExpc3RlbmVyKGRlYm91bmNlKXtcbiAgbGV0IHRpbWVyLFxuICAgICAgJG5vZGVzID0gJCgnW2RhdGEtc2Nyb2xsXScpO1xuICBpZigkbm9kZXMubGVuZ3RoKXtcbiAgICAkKHdpbmRvdykub2ZmKCdzY3JvbGwuemYudHJpZ2dlcicpXG4gICAgLm9uKCdzY3JvbGwuemYudHJpZ2dlcicsIGZ1bmN0aW9uKGUpe1xuICAgICAgaWYodGltZXIpeyBjbGVhclRpbWVvdXQodGltZXIpOyB9XG5cbiAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuXG4gICAgICAgIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsvL2ZhbGxiYWNrIGZvciBJRSA5XG4gICAgICAgICAgJG5vZGVzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ3Njcm9sbG1lLnpmLnRyaWdnZXInKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgc2Nyb2xsIGV2ZW50XG4gICAgICAgICRub2Rlcy5hdHRyKCdkYXRhLWV2ZW50cycsIFwic2Nyb2xsXCIpO1xuICAgICAgfSwgZGVib3VuY2UgfHwgMTApOy8vZGVmYXVsdCB0aW1lIHRvIGVtaXQgc2Nyb2xsIGV2ZW50XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXZlbnRzTGlzdGVuZXIoKSB7XG4gIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsgcmV0dXJuIGZhbHNlOyB9XG4gIGxldCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXJlc2l6ZV0sIFtkYXRhLXNjcm9sbF0sIFtkYXRhLW11dGF0ZV0nKTtcblxuICAvL2VsZW1lbnQgY2FsbGJhY2tcbiAgdmFyIGxpc3RlbmluZ0VsZW1lbnRzTXV0YXRpb24gPSBmdW5jdGlvbihtdXRhdGlvblJlY29yZHNMaXN0KSB7XG4gICAgdmFyICR0YXJnZXQgPSAkKG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0udGFyZ2V0KTtcbiAgICAvL3RyaWdnZXIgdGhlIGV2ZW50IGhhbmRsZXIgZm9yIHRoZSBlbGVtZW50IGRlcGVuZGluZyBvbiB0eXBlXG4gICAgc3dpdGNoICgkdGFyZ2V0LmF0dHIoXCJkYXRhLWV2ZW50c1wiKSkge1xuXG4gICAgICBjYXNlIFwicmVzaXplXCIgOlxuICAgICAgJHRhcmdldC50cmlnZ2VySGFuZGxlcigncmVzaXplbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0XSk7XG4gICAgICBicmVhaztcblxuICAgICAgY2FzZSBcInNjcm9sbFwiIDpcbiAgICAgICR0YXJnZXQudHJpZ2dlckhhbmRsZXIoJ3Njcm9sbG1lLnpmLnRyaWdnZXInLCBbJHRhcmdldCwgd2luZG93LnBhZ2VZT2Zmc2V0XSk7XG4gICAgICBicmVhaztcblxuICAgICAgLy8gY2FzZSBcIm11dGF0ZVwiIDpcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdtdXRhdGUnLCAkdGFyZ2V0KTtcbiAgICAgIC8vICR0YXJnZXQudHJpZ2dlckhhbmRsZXIoJ211dGF0ZS56Zi50cmlnZ2VyJyk7XG4gICAgICAvL1xuICAgICAgLy8gLy9tYWtlIHN1cmUgd2UgZG9uJ3QgZ2V0IHN0dWNrIGluIGFuIGluZmluaXRlIGxvb3AgZnJvbSBzbG9wcHkgY29kZWluZ1xuICAgICAgLy8gaWYgKCR0YXJnZXQuaW5kZXgoJ1tkYXRhLW11dGF0ZV0nKSA9PSAkKFwiW2RhdGEtbXV0YXRlXVwiKS5sZW5ndGgtMSkge1xuICAgICAgLy8gICBkb21NdXRhdGlvbk9ic2VydmVyKCk7XG4gICAgICAvLyB9XG4gICAgICAvLyBicmVhaztcblxuICAgICAgZGVmYXVsdCA6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAvL25vdGhpbmdcbiAgICB9XG4gIH1cblxuICBpZihub2Rlcy5sZW5ndGgpe1xuICAgIC8vZm9yIGVhY2ggZWxlbWVudCB0aGF0IG5lZWRzIHRvIGxpc3RlbiBmb3IgcmVzaXppbmcsIHNjcm9sbGluZywgKG9yIGNvbWluZyBzb29uIG11dGF0aW9uKSBhZGQgYSBzaW5nbGUgb2JzZXJ2ZXJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBub2Rlcy5sZW5ndGgtMTsgaSsrKSB7XG4gICAgICBsZXQgZWxlbWVudE9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIobGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbik7XG4gICAgICBlbGVtZW50T2JzZXJ2ZXIub2JzZXJ2ZShub2Rlc1tpXSwgeyBhdHRyaWJ1dGVzOiB0cnVlLCBjaGlsZExpc3Q6IGZhbHNlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTpmYWxzZSwgYXR0cmlidXRlRmlsdGVyOltcImRhdGEtZXZlbnRzXCJdfSk7XG4gICAgfVxuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBbUEhdXG4vLyBGb3VuZGF0aW9uLkNoZWNrV2F0Y2hlcnMgPSBjaGVja1dhdGNoZXJzO1xuRm91bmRhdGlvbi5JSGVhcllvdSA9IGNoZWNrTGlzdGVuZXJzO1xuLy8gRm91bmRhdGlvbi5JU2VlWW91ID0gc2Nyb2xsTGlzdGVuZXI7XG4vLyBGb3VuZGF0aW9uLklGZWVsWW91ID0gY2xvc2VtZUxpc3RlbmVyO1xuXG59KGpRdWVyeSk7XG5cbi8vIGZ1bmN0aW9uIGRvbU11dGF0aW9uT2JzZXJ2ZXIoZGVib3VuY2UpIHtcbi8vICAgLy8gISEhIFRoaXMgaXMgY29taW5nIHNvb24gYW5kIG5lZWRzIG1vcmUgd29yazsgbm90IGFjdGl2ZSAgISEhIC8vXG4vLyAgIHZhciB0aW1lcixcbi8vICAgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1tdXRhdGVdJyk7XG4vLyAgIC8vXG4vLyAgIGlmIChub2Rlcy5sZW5ndGgpIHtcbi8vICAgICAvLyB2YXIgTXV0YXRpb25PYnNlcnZlciA9IChmdW5jdGlvbiAoKSB7XG4vLyAgICAgLy8gICB2YXIgcHJlZml4ZXMgPSBbJ1dlYktpdCcsICdNb3onLCAnTycsICdNcycsICcnXTtcbi8vICAgICAvLyAgIGZvciAodmFyIGk9MDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgLy8gICAgIGlmIChwcmVmaXhlc1tpXSArICdNdXRhdGlvbk9ic2VydmVyJyBpbiB3aW5kb3cpIHtcbi8vICAgICAvLyAgICAgICByZXR1cm4gd2luZG93W3ByZWZpeGVzW2ldICsgJ011dGF0aW9uT2JzZXJ2ZXInXTtcbi8vICAgICAvLyAgICAgfVxuLy8gICAgIC8vICAgfVxuLy8gICAgIC8vICAgcmV0dXJuIGZhbHNlO1xuLy8gICAgIC8vIH0oKSk7XG4vL1xuLy9cbi8vICAgICAvL2ZvciB0aGUgYm9keSwgd2UgbmVlZCB0byBsaXN0ZW4gZm9yIGFsbCBjaGFuZ2VzIGVmZmVjdGluZyB0aGUgc3R5bGUgYW5kIGNsYXNzIGF0dHJpYnV0ZXNcbi8vICAgICB2YXIgYm9keU9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoYm9keU11dGF0aW9uKTtcbi8vICAgICBib2R5T2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7IGF0dHJpYnV0ZXM6IHRydWUsIGNoaWxkTGlzdDogdHJ1ZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UsIHN1YnRyZWU6dHJ1ZSwgYXR0cmlidXRlRmlsdGVyOltcInN0eWxlXCIsIFwiY2xhc3NcIl19KTtcbi8vXG4vL1xuLy8gICAgIC8vYm9keSBjYWxsYmFja1xuLy8gICAgIGZ1bmN0aW9uIGJvZHlNdXRhdGlvbihtdXRhdGUpIHtcbi8vICAgICAgIC8vdHJpZ2dlciBhbGwgbGlzdGVuaW5nIGVsZW1lbnRzIGFuZCBzaWduYWwgYSBtdXRhdGlvbiBldmVudFxuLy8gICAgICAgaWYgKHRpbWVyKSB7IGNsZWFyVGltZW91dCh0aW1lcik7IH1cbi8vXG4vLyAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4vLyAgICAgICAgIGJvZHlPYnNlcnZlci5kaXNjb25uZWN0KCk7XG4vLyAgICAgICAgICQoJ1tkYXRhLW11dGF0ZV0nKS5hdHRyKCdkYXRhLWV2ZW50cycsXCJtdXRhdGVcIik7XG4vLyAgICAgICB9LCBkZWJvdW5jZSB8fCAxNTApO1xuLy8gICAgIH1cbi8vICAgfVxuLy8gfVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIEFiaWRlIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5hYmlkZVxuICovXG5cbmNsYXNzIEFiaWRlIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgQWJpZGUuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgQWJpZGUjaW5pdFxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYWRkIHRoZSB0cmlnZ2VyIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgID0gJC5leHRlbmQoe30sIEFiaWRlLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdBYmlkZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBBYmlkZSBwbHVnaW4gYW5kIGNhbGxzIGZ1bmN0aW9ucyB0byBnZXQgQWJpZGUgZnVuY3Rpb25pbmcgb24gbG9hZC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHRoaXMuJGlucHV0cyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnaW5wdXQsIHRleHRhcmVhLCBzZWxlY3QnKS5ub3QoJ1tkYXRhLWFiaWRlLWlnbm9yZV0nKTtcblxuICAgIHRoaXMuX2V2ZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgQWJpZGUuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuYWJpZGUnKVxuICAgICAgLm9uKCdyZXNldC56Zi5hYmlkZScsICgpID0+IHtcbiAgICAgICAgdGhpcy5yZXNldEZvcm0oKTtcbiAgICAgIH0pXG4gICAgICAub24oJ3N1Ym1pdC56Zi5hYmlkZScsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsaWRhdGVGb3JtKCk7XG4gICAgICB9KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMudmFsaWRhdGVPbiA9PT0gJ2ZpZWxkQ2hhbmdlJykge1xuICAgICAgdGhpcy4kaW5wdXRzXG4gICAgICAgIC5vZmYoJ2NoYW5nZS56Zi5hYmlkZScpXG4gICAgICAgIC5vbignY2hhbmdlLnpmLmFiaWRlJywgKGUpID0+IHtcbiAgICAgICAgICB0aGlzLnZhbGlkYXRlSW5wdXQoJChlLnRhcmdldCkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmxpdmVWYWxpZGF0ZSkge1xuICAgICAgdGhpcy4kaW5wdXRzXG4gICAgICAgIC5vZmYoJ2lucHV0LnpmLmFiaWRlJylcbiAgICAgICAgLm9uKCdpbnB1dC56Zi5hYmlkZScsIChlKSA9PiB7XG4gICAgICAgICAgdGhpcy52YWxpZGF0ZUlucHV0KCQoZS50YXJnZXQpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxzIG5lY2Vzc2FyeSBmdW5jdGlvbnMgdG8gdXBkYXRlIEFiaWRlIHVwb24gRE9NIGNoYW5nZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3JlZmxvdygpIHtcbiAgICB0aGlzLl9pbml0KCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgb3Igbm90IGEgZm9ybSBlbGVtZW50IGhhcyB0aGUgcmVxdWlyZWQgYXR0cmlidXRlIGFuZCBpZiBpdCdzIGNoZWNrZWQgb3Igbm90XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBjaGVjayBmb3IgcmVxdWlyZWQgYXR0cmlidXRlXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBCb29sZWFuIHZhbHVlIGRlcGVuZHMgb24gd2hldGhlciBvciBub3QgYXR0cmlidXRlIGlzIGNoZWNrZWQgb3IgZW1wdHlcbiAgICovXG4gIHJlcXVpcmVkQ2hlY2soJGVsKSB7XG4gICAgaWYgKCEkZWwuYXR0cigncmVxdWlyZWQnKSkgcmV0dXJuIHRydWU7XG5cbiAgICB2YXIgaXNHb29kID0gdHJ1ZTtcblxuICAgIHN3aXRjaCAoJGVsWzBdLnR5cGUpIHtcbiAgICAgIGNhc2UgJ3NlbGVjdCc6XG4gICAgICBjYXNlICdzZWxlY3Qtb25lJzpcbiAgICAgIGNhc2UgJ3NlbGVjdC1tdWx0aXBsZSc6XG4gICAgICAgIHZhciBvcHQgPSAkZWwuZmluZCgnb3B0aW9uOnNlbGVjdGVkJyk7XG4gICAgICAgIGlmICghb3B0Lmxlbmd0aCB8fCAhb3B0LnZhbCgpKSBpc0dvb2QgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmKCEkZWwudmFsKCkgfHwgISRlbC52YWwoKS5sZW5ndGgpIGlzR29vZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiBpc0dvb2Q7XG4gIH1cblxuICAvKipcbiAgICogQmFzZWQgb24gJGVsLCBnZXQgdGhlIGZpcnN0IGVsZW1lbnQgd2l0aCBzZWxlY3RvciBpbiB0aGlzIG9yZGVyOlxuICAgKiAxLiBUaGUgZWxlbWVudCdzIGRpcmVjdCBzaWJsaW5nKCdzKS5cbiAgICogMy4gVGhlIGVsZW1lbnQncyBwYXJlbnQncyBjaGlsZHJlbi5cbiAgICpcbiAgICogVGhpcyBhbGxvd3MgZm9yIG11bHRpcGxlIGZvcm0gZXJyb3JzIHBlciBpbnB1dCwgdGhvdWdoIGlmIG5vbmUgYXJlIGZvdW5kLCBubyBmb3JtIGVycm9ycyB3aWxsIGJlIHNob3duLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gJGVsIC0galF1ZXJ5IG9iamVjdCB0byB1c2UgYXMgcmVmZXJlbmNlIHRvIGZpbmQgdGhlIGZvcm0gZXJyb3Igc2VsZWN0b3IuXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IGpRdWVyeSBvYmplY3Qgd2l0aCB0aGUgc2VsZWN0b3IuXG4gICAqL1xuICBmaW5kRm9ybUVycm9yKCRlbCkge1xuICAgIHZhciAkZXJyb3IgPSAkZWwuc2libGluZ3ModGhpcy5vcHRpb25zLmZvcm1FcnJvclNlbGVjdG9yKTtcblxuICAgIGlmICghJGVycm9yLmxlbmd0aCkge1xuICAgICAgJGVycm9yID0gJGVsLnBhcmVudCgpLmZpbmQodGhpcy5vcHRpb25zLmZvcm1FcnJvclNlbGVjdG9yKTtcbiAgICB9XG5cbiAgICByZXR1cm4gJGVycm9yO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgZmlyc3QgZWxlbWVudCBpbiB0aGlzIG9yZGVyOlxuICAgKiAyLiBUaGUgPGxhYmVsPiB3aXRoIHRoZSBhdHRyaWJ1dGUgYFtmb3I9XCJzb21lSW5wdXRJZFwiXWBcbiAgICogMy4gVGhlIGAuY2xvc2VzdCgpYCA8bGFiZWw+XG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAkZWwgLSBqUXVlcnkgb2JqZWN0IHRvIGNoZWNrIGZvciByZXF1aXJlZCBhdHRyaWJ1dGVcbiAgICogQHJldHVybnMge0Jvb2xlYW59IEJvb2xlYW4gdmFsdWUgZGVwZW5kcyBvbiB3aGV0aGVyIG9yIG5vdCBhdHRyaWJ1dGUgaXMgY2hlY2tlZCBvciBlbXB0eVxuICAgKi9cbiAgZmluZExhYmVsKCRlbCkge1xuICAgIHZhciBpZCA9ICRlbFswXS5pZDtcbiAgICB2YXIgJGxhYmVsID0gdGhpcy4kZWxlbWVudC5maW5kKGBsYWJlbFtmb3I9XCIke2lkfVwiXWApO1xuXG4gICAgaWYgKCEkbGFiZWwubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gJGVsLmNsb3Nlc3QoJ2xhYmVsJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuICRsYWJlbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHNldCBvZiBsYWJlbHMgYXNzb2NpYXRlZCB3aXRoIGEgc2V0IG9mIHJhZGlvIGVscyBpbiB0aGlzIG9yZGVyXG4gICAqIDIuIFRoZSA8bGFiZWw+IHdpdGggdGhlIGF0dHJpYnV0ZSBgW2Zvcj1cInNvbWVJbnB1dElkXCJdYFxuICAgKiAzLiBUaGUgYC5jbG9zZXN0KClgIDxsYWJlbD5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9ICRlbCAtIGpRdWVyeSBvYmplY3QgdG8gY2hlY2sgZm9yIHJlcXVpcmVkIGF0dHJpYnV0ZVxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gQm9vbGVhbiB2YWx1ZSBkZXBlbmRzIG9uIHdoZXRoZXIgb3Igbm90IGF0dHJpYnV0ZSBpcyBjaGVja2VkIG9yIGVtcHR5XG4gICAqL1xuICBmaW5kUmFkaW9MYWJlbHMoJGVscykge1xuICAgIHZhciBsYWJlbHMgPSAkZWxzLm1hcCgoaSwgZWwpID0+IHtcbiAgICAgIHZhciBpZCA9IGVsLmlkO1xuICAgICAgdmFyICRsYWJlbCA9IHRoaXMuJGVsZW1lbnQuZmluZChgbGFiZWxbZm9yPVwiJHtpZH1cIl1gKTtcblxuICAgICAgaWYgKCEkbGFiZWwubGVuZ3RoKSB7XG4gICAgICAgICRsYWJlbCA9ICQoZWwpLmNsb3Nlc3QoJ2xhYmVsJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gJGxhYmVsWzBdO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuICQobGFiZWxzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBDU1MgZXJyb3IgY2xhc3MgYXMgc3BlY2lmaWVkIGJ5IHRoZSBBYmlkZSBzZXR0aW5ncyB0byB0aGUgbGFiZWwsIGlucHV0LCBhbmQgdGhlIGZvcm1cbiAgICogQHBhcmFtIHtPYmplY3R9ICRlbCAtIGpRdWVyeSBvYmplY3QgdG8gYWRkIHRoZSBjbGFzcyB0b1xuICAgKi9cbiAgYWRkRXJyb3JDbGFzc2VzKCRlbCkge1xuICAgIHZhciAkbGFiZWwgPSB0aGlzLmZpbmRMYWJlbCgkZWwpO1xuICAgIHZhciAkZm9ybUVycm9yID0gdGhpcy5maW5kRm9ybUVycm9yKCRlbCk7XG5cbiAgICBpZiAoJGxhYmVsLmxlbmd0aCkge1xuICAgICAgJGxhYmVsLmFkZENsYXNzKHRoaXMub3B0aW9ucy5sYWJlbEVycm9yQ2xhc3MpO1xuICAgIH1cblxuICAgIGlmICgkZm9ybUVycm9yLmxlbmd0aCkge1xuICAgICAgJGZvcm1FcnJvci5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuZm9ybUVycm9yQ2xhc3MpO1xuICAgIH1cblxuICAgICRlbC5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuaW5wdXRFcnJvckNsYXNzKS5hdHRyKCdkYXRhLWludmFsaWQnLCAnJyk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIENTUyBlcnJvciBjbGFzc2VzIGV0YyBmcm9tIGFuIGVudGlyZSByYWRpbyBidXR0b24gZ3JvdXBcbiAgICogQHBhcmFtIHtTdHJpbmd9IGdyb3VwTmFtZSAtIEEgc3RyaW5nIHRoYXQgc3BlY2lmaWVzIHRoZSBuYW1lIG9mIGEgcmFkaW8gYnV0dG9uIGdyb3VwXG4gICAqXG4gICAqL1xuXG4gIHJlbW92ZVJhZGlvRXJyb3JDbGFzc2VzKGdyb3VwTmFtZSkge1xuICAgIHZhciAkZWxzID0gdGhpcy4kZWxlbWVudC5maW5kKGA6cmFkaW9bbmFtZT1cIiR7Z3JvdXBOYW1lfVwiXWApO1xuICAgIHZhciAkbGFiZWxzID0gdGhpcy5maW5kUmFkaW9MYWJlbHMoJGVscyk7XG4gICAgdmFyICRmb3JtRXJyb3JzID0gdGhpcy5maW5kRm9ybUVycm9yKCRlbHMpO1xuXG4gICAgaWYgKCRsYWJlbHMubGVuZ3RoKSB7XG4gICAgICAkbGFiZWxzLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5sYWJlbEVycm9yQ2xhc3MpO1xuICAgIH1cblxuICAgIGlmICgkZm9ybUVycm9ycy5sZW5ndGgpIHtcbiAgICAgICRmb3JtRXJyb3JzLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5mb3JtRXJyb3JDbGFzcyk7XG4gICAgfVxuXG4gICAgJGVscy5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuaW5wdXRFcnJvckNsYXNzKS5yZW1vdmVBdHRyKCdkYXRhLWludmFsaWQnKTtcblxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgQ1NTIGVycm9yIGNsYXNzIGFzIHNwZWNpZmllZCBieSB0aGUgQWJpZGUgc2V0dGluZ3MgZnJvbSB0aGUgbGFiZWwsIGlucHV0LCBhbmQgdGhlIGZvcm1cbiAgICogQHBhcmFtIHtPYmplY3R9ICRlbCAtIGpRdWVyeSBvYmplY3QgdG8gcmVtb3ZlIHRoZSBjbGFzcyBmcm9tXG4gICAqL1xuICByZW1vdmVFcnJvckNsYXNzZXMoJGVsKSB7XG4gICAgLy8gcmFkaW9zIG5lZWQgdG8gY2xlYXIgYWxsIG9mIHRoZSBlbHNcbiAgICBpZigkZWxbMF0udHlwZSA9PSAncmFkaW8nKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZW1vdmVSYWRpb0Vycm9yQ2xhc3NlcygkZWwuYXR0cignbmFtZScpKTtcbiAgICB9XG5cbiAgICB2YXIgJGxhYmVsID0gdGhpcy5maW5kTGFiZWwoJGVsKTtcbiAgICB2YXIgJGZvcm1FcnJvciA9IHRoaXMuZmluZEZvcm1FcnJvcigkZWwpO1xuXG4gICAgaWYgKCRsYWJlbC5sZW5ndGgpIHtcbiAgICAgICRsYWJlbC5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMubGFiZWxFcnJvckNsYXNzKTtcbiAgICB9XG5cbiAgICBpZiAoJGZvcm1FcnJvci5sZW5ndGgpIHtcbiAgICAgICRmb3JtRXJyb3IucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmZvcm1FcnJvckNsYXNzKTtcbiAgICB9XG5cbiAgICAkZWwucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmlucHV0RXJyb3JDbGFzcykucmVtb3ZlQXR0cignZGF0YS1pbnZhbGlkJyk7XG4gIH1cblxuICAvKipcbiAgICogR29lcyB0aHJvdWdoIGEgZm9ybSB0byBmaW5kIGlucHV0cyBhbmQgcHJvY2VlZHMgdG8gdmFsaWRhdGUgdGhlbSBpbiB3YXlzIHNwZWNpZmljIHRvIHRoZWlyIHR5cGVcbiAgICogQGZpcmVzIEFiaWRlI2ludmFsaWRcbiAgICogQGZpcmVzIEFiaWRlI3ZhbGlkXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byB2YWxpZGF0ZSwgc2hvdWxkIGJlIGFuIEhUTUwgaW5wdXRcbiAgICogQHJldHVybnMge0Jvb2xlYW59IGdvb2RUb0dvIC0gSWYgdGhlIGlucHV0IGlzIHZhbGlkIG9yIG5vdC5cbiAgICovXG4gIHZhbGlkYXRlSW5wdXQoJGVsKSB7XG4gICAgdmFyIGNsZWFyUmVxdWlyZSA9IHRoaXMucmVxdWlyZWRDaGVjaygkZWwpLFxuICAgICAgICB2YWxpZGF0ZWQgPSBmYWxzZSxcbiAgICAgICAgY3VzdG9tVmFsaWRhdG9yID0gdHJ1ZSxcbiAgICAgICAgdmFsaWRhdG9yID0gJGVsLmF0dHIoJ2RhdGEtdmFsaWRhdG9yJyksXG4gICAgICAgIGVxdWFsVG8gPSB0cnVlO1xuXG4gICAgc3dpdGNoICgkZWxbMF0udHlwZSkge1xuICAgICAgY2FzZSAncmFkaW8nOlxuICAgICAgICB2YWxpZGF0ZWQgPSB0aGlzLnZhbGlkYXRlUmFkaW8oJGVsLmF0dHIoJ25hbWUnKSk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjaGVja2JveCc6XG4gICAgICAgIHZhbGlkYXRlZCA9IGNsZWFyUmVxdWlyZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3NlbGVjdCc6XG4gICAgICBjYXNlICdzZWxlY3Qtb25lJzpcbiAgICAgIGNhc2UgJ3NlbGVjdC1tdWx0aXBsZSc6XG4gICAgICAgIHZhbGlkYXRlZCA9IGNsZWFyUmVxdWlyZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhbGlkYXRlZCA9IHRoaXMudmFsaWRhdGVUZXh0KCRlbCk7XG4gICAgfVxuXG4gICAgaWYgKHZhbGlkYXRvcikge1xuICAgICAgY3VzdG9tVmFsaWRhdG9yID0gdGhpcy5tYXRjaFZhbGlkYXRpb24oJGVsLCB2YWxpZGF0b3IsICRlbC5hdHRyKCdyZXF1aXJlZCcpKTtcbiAgICB9XG5cbiAgICBpZiAoJGVsLmF0dHIoJ2RhdGEtZXF1YWx0bycpKSB7XG4gICAgICBlcXVhbFRvID0gdGhpcy5vcHRpb25zLnZhbGlkYXRvcnMuZXF1YWxUbygkZWwpO1xuICAgIH1cblxuXG4gICAgdmFyIGdvb2RUb0dvID0gW2NsZWFyUmVxdWlyZSwgdmFsaWRhdGVkLCBjdXN0b21WYWxpZGF0b3IsIGVxdWFsVG9dLmluZGV4T2YoZmFsc2UpID09PSAtMTtcbiAgICB2YXIgbWVzc2FnZSA9IChnb29kVG9HbyA/ICd2YWxpZCcgOiAnaW52YWxpZCcpICsgJy56Zi5hYmlkZSc7XG5cbiAgICB0aGlzW2dvb2RUb0dvID8gJ3JlbW92ZUVycm9yQ2xhc3NlcycgOiAnYWRkRXJyb3JDbGFzc2VzJ10oJGVsKTtcblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIGlucHV0IGlzIGRvbmUgY2hlY2tpbmcgZm9yIHZhbGlkYXRpb24uIEV2ZW50IHRyaWdnZXIgaXMgZWl0aGVyIGB2YWxpZC56Zi5hYmlkZWAgb3IgYGludmFsaWQuemYuYWJpZGVgXG4gICAgICogVHJpZ2dlciBpbmNsdWRlcyB0aGUgRE9NIGVsZW1lbnQgb2YgdGhlIGlucHV0LlxuICAgICAqIEBldmVudCBBYmlkZSN2YWxpZFxuICAgICAqIEBldmVudCBBYmlkZSNpbnZhbGlkXG4gICAgICovXG4gICAgJGVsLnRyaWdnZXIobWVzc2FnZSwgWyRlbF0pO1xuXG4gICAgcmV0dXJuIGdvb2RUb0dvO1xuICB9XG5cbiAgLyoqXG4gICAqIEdvZXMgdGhyb3VnaCBhIGZvcm0gYW5kIGlmIHRoZXJlIGFyZSBhbnkgaW52YWxpZCBpbnB1dHMsIGl0IHdpbGwgZGlzcGxheSB0aGUgZm9ybSBlcnJvciBlbGVtZW50XG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBub0Vycm9yIC0gdHJ1ZSBpZiBubyBlcnJvcnMgd2VyZSBkZXRlY3RlZC4uLlxuICAgKiBAZmlyZXMgQWJpZGUjZm9ybXZhbGlkXG4gICAqIEBmaXJlcyBBYmlkZSNmb3JtaW52YWxpZFxuICAgKi9cbiAgdmFsaWRhdGVGb3JtKCkge1xuICAgIHZhciBhY2MgPSBbXTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy4kaW5wdXRzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICBhY2MucHVzaChfdGhpcy52YWxpZGF0ZUlucHV0KCQodGhpcykpKTtcbiAgICB9KTtcblxuICAgIHZhciBub0Vycm9yID0gYWNjLmluZGV4T2YoZmFsc2UpID09PSAtMTtcblxuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtYWJpZGUtZXJyb3JdJykuY3NzKCdkaXNwbGF5JywgKG5vRXJyb3IgPyAnbm9uZScgOiAnYmxvY2snKSk7XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBmb3JtIGlzIGZpbmlzaGVkIHZhbGlkYXRpbmcuIEV2ZW50IHRyaWdnZXIgaXMgZWl0aGVyIGBmb3JtdmFsaWQuemYuYWJpZGVgIG9yIGBmb3JtaW52YWxpZC56Zi5hYmlkZWAuXG4gICAgICogVHJpZ2dlciBpbmNsdWRlcyB0aGUgZWxlbWVudCBvZiB0aGUgZm9ybS5cbiAgICAgKiBAZXZlbnQgQWJpZGUjZm9ybXZhbGlkXG4gICAgICogQGV2ZW50IEFiaWRlI2Zvcm1pbnZhbGlkXG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKChub0Vycm9yID8gJ2Zvcm12YWxpZCcgOiAnZm9ybWludmFsaWQnKSArICcuemYuYWJpZGUnLCBbdGhpcy4kZWxlbWVudF0pO1xuXG4gICAgcmV0dXJuIG5vRXJyb3I7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIG9yIGEgbm90IGEgdGV4dCBpbnB1dCBpcyB2YWxpZCBiYXNlZCBvbiB0aGUgcGF0dGVybiBzcGVjaWZpZWQgaW4gdGhlIGF0dHJpYnV0ZS4gSWYgbm8gbWF0Y2hpbmcgcGF0dGVybiBpcyBmb3VuZCwgcmV0dXJucyB0cnVlLlxuICAgKiBAcGFyYW0ge09iamVjdH0gJGVsIC0galF1ZXJ5IG9iamVjdCB0byB2YWxpZGF0ZSwgc2hvdWxkIGJlIGEgdGV4dCBpbnB1dCBIVE1MIGVsZW1lbnRcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdHRlcm4gLSBzdHJpbmcgdmFsdWUgb2Ygb25lIG9mIHRoZSBSZWdFeCBwYXR0ZXJucyBpbiBBYmlkZS5vcHRpb25zLnBhdHRlcm5zXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBCb29sZWFuIHZhbHVlIGRlcGVuZHMgb24gd2hldGhlciBvciBub3QgdGhlIGlucHV0IHZhbHVlIG1hdGNoZXMgdGhlIHBhdHRlcm4gc3BlY2lmaWVkXG4gICAqL1xuICB2YWxpZGF0ZVRleHQoJGVsLCBwYXR0ZXJuKSB7XG4gICAgLy8gQSBwYXR0ZXJuIGNhbiBiZSBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbiwgb3IgaXQgd2lsbCBiZSBpbmZlcmVkIGZyb20gdGhlIGlucHV0J3MgXCJwYXR0ZXJuXCIgYXR0cmlidXRlLCBvciBpdCdzIFwidHlwZVwiIGF0dHJpYnV0ZVxuICAgIHBhdHRlcm4gPSAocGF0dGVybiB8fCAkZWwuYXR0cigncGF0dGVybicpIHx8ICRlbC5hdHRyKCd0eXBlJykpO1xuICAgIHZhciBpbnB1dFRleHQgPSAkZWwudmFsKCk7XG4gICAgdmFyIHZhbGlkID0gZmFsc2U7XG5cbiAgICBpZiAoaW5wdXRUZXh0Lmxlbmd0aCkge1xuICAgICAgLy8gSWYgdGhlIHBhdHRlcm4gYXR0cmlidXRlIG9uIHRoZSBlbGVtZW50IGlzIGluIEFiaWRlJ3MgbGlzdCBvZiBwYXR0ZXJucywgdGhlbiB0ZXN0IHRoYXQgcmVnZXhwXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnBhdHRlcm5zLmhhc093blByb3BlcnR5KHBhdHRlcm4pKSB7XG4gICAgICAgIHZhbGlkID0gdGhpcy5vcHRpb25zLnBhdHRlcm5zW3BhdHRlcm5dLnRlc3QoaW5wdXRUZXh0KTtcbiAgICAgIH1cbiAgICAgIC8vIElmIHRoZSBwYXR0ZXJuIG5hbWUgaXNuJ3QgYWxzbyB0aGUgdHlwZSBhdHRyaWJ1dGUgb2YgdGhlIGZpZWxkLCB0aGVuIHRlc3QgaXQgYXMgYSByZWdleHBcbiAgICAgIGVsc2UgaWYgKHBhdHRlcm4gIT09ICRlbC5hdHRyKCd0eXBlJykpIHtcbiAgICAgICAgdmFsaWQgPSBuZXcgUmVnRXhwKHBhdHRlcm4pLnRlc3QoaW5wdXRUZXh0KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB2YWxpZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEFuIGVtcHR5IGZpZWxkIGlzIHZhbGlkIGlmIGl0J3Mgbm90IHJlcXVpcmVkXG4gICAgZWxzZSBpZiAoISRlbC5wcm9wKCdyZXF1aXJlZCcpKSB7XG4gICAgICB2YWxpZCA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbGlkO1xuICAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgb3IgYSBub3QgYSByYWRpbyBpbnB1dCBpcyB2YWxpZCBiYXNlZCBvbiB3aGV0aGVyIG9yIG5vdCBpdCBpcyByZXF1aXJlZCBhbmQgc2VsZWN0ZWQuIEFsdGhvdWdoIHRoZSBmdW5jdGlvbiB0YXJnZXRzIGEgc2luZ2xlIGA8aW5wdXQ+YCwgaXQgdmFsaWRhdGVzIGJ5IGNoZWNraW5nIHRoZSBgcmVxdWlyZWRgIGFuZCBgY2hlY2tlZGAgcHJvcGVydGllcyBvZiBhbGwgcmFkaW8gYnV0dG9ucyBpbiBpdHMgZ3JvdXAuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBncm91cE5hbWUgLSBBIHN0cmluZyB0aGF0IHNwZWNpZmllcyB0aGUgbmFtZSBvZiBhIHJhZGlvIGJ1dHRvbiBncm91cFxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gQm9vbGVhbiB2YWx1ZSBkZXBlbmRzIG9uIHdoZXRoZXIgb3Igbm90IGF0IGxlYXN0IG9uZSByYWRpbyBpbnB1dCBoYXMgYmVlbiBzZWxlY3RlZCAoaWYgaXQncyByZXF1aXJlZClcbiAgICovXG4gIHZhbGlkYXRlUmFkaW8oZ3JvdXBOYW1lKSB7XG4gICAgLy8gSWYgYXQgbGVhc3Qgb25lIHJhZGlvIGluIHRoZSBncm91cCBoYXMgdGhlIGByZXF1aXJlZGAgYXR0cmlidXRlLCB0aGUgZ3JvdXAgaXMgY29uc2lkZXJlZCByZXF1aXJlZFxuICAgIC8vIFBlciBXM0Mgc3BlYywgYWxsIHJhZGlvIGJ1dHRvbnMgaW4gYSBncm91cCBzaG91bGQgaGF2ZSBgcmVxdWlyZWRgLCBidXQgd2UncmUgYmVpbmcgbmljZVxuICAgIHZhciAkZ3JvdXAgPSB0aGlzLiRlbGVtZW50LmZpbmQoYDpyYWRpb1tuYW1lPVwiJHtncm91cE5hbWV9XCJdYCk7XG4gICAgdmFyIHZhbGlkID0gZmFsc2U7XG5cbiAgICAvLyAuYXR0cigpIHJldHVybnMgdW5kZWZpbmVkIGlmIG5vIGVsZW1lbnRzIGluICRncm91cCBoYXZlIHRoZSBhdHRyaWJ1dGUgXCJyZXF1aXJlZFwiXG4gICAgaWYgKCRncm91cC5hdHRyKCdyZXF1aXJlZCcpID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHZhbGlkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBGb3IgdGhlIGdyb3VwIHRvIGJlIHZhbGlkLCBhdCBsZWFzdCBvbmUgcmFkaW8gbmVlZHMgdG8gYmUgY2hlY2tlZFxuICAgICRncm91cC5lYWNoKChpLCBlKSA9PiB7XG4gICAgICBpZiAoJChlKS5wcm9wKCdjaGVja2VkJykpIHtcbiAgICAgICAgdmFsaWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHZhbGlkO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgYSBzZWxlY3RlZCBpbnB1dCBwYXNzZXMgYSBjdXN0b20gdmFsaWRhdGlvbiBmdW5jdGlvbi4gTXVsdGlwbGUgdmFsaWRhdGlvbnMgY2FuIGJlIHVzZWQsIGlmIHBhc3NlZCB0byB0aGUgZWxlbWVudCB3aXRoIGBkYXRhLXZhbGlkYXRvcj1cImZvbyBiYXIgYmF6XCJgIGluIGEgc3BhY2Ugc2VwYXJhdGVkIGxpc3RlZC5cbiAgICogQHBhcmFtIHtPYmplY3R9ICRlbCAtIGpRdWVyeSBpbnB1dCBlbGVtZW50LlxuICAgKiBAcGFyYW0ge1N0cmluZ30gdmFsaWRhdG9ycyAtIGEgc3RyaW5nIG9mIGZ1bmN0aW9uIG5hbWVzIG1hdGNoaW5nIGZ1bmN0aW9ucyBpbiB0aGUgQWJpZGUub3B0aW9ucy52YWxpZGF0b3JzIG9iamVjdC5cbiAgICogQHBhcmFtIHtCb29sZWFufSByZXF1aXJlZCAtIHNlbGYgZXhwbGFuYXRvcnk/XG4gICAqIEByZXR1cm5zIHtCb29sZWFufSAtIHRydWUgaWYgdmFsaWRhdGlvbnMgcGFzc2VkLlxuICAgKi9cbiAgbWF0Y2hWYWxpZGF0aW9uKCRlbCwgdmFsaWRhdG9ycywgcmVxdWlyZWQpIHtcbiAgICByZXF1aXJlZCA9IHJlcXVpcmVkID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgdmFyIGNsZWFyID0gdmFsaWRhdG9ycy5zcGxpdCgnICcpLm1hcCgodikgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy52YWxpZGF0b3JzW3ZdKCRlbCwgcmVxdWlyZWQsICRlbC5wYXJlbnQoKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGNsZWFyLmluZGV4T2YoZmFsc2UpID09PSAtMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldHMgZm9ybSBpbnB1dHMgYW5kIHN0eWxlc1xuICAgKiBAZmlyZXMgQWJpZGUjZm9ybXJlc2V0XG4gICAqL1xuICByZXNldEZvcm0oKSB7XG4gICAgdmFyICRmb3JtID0gdGhpcy4kZWxlbWVudCxcbiAgICAgICAgb3B0cyA9IHRoaXMub3B0aW9ucztcblxuICAgICQoYC4ke29wdHMubGFiZWxFcnJvckNsYXNzfWAsICRmb3JtKS5ub3QoJ3NtYWxsJykucmVtb3ZlQ2xhc3Mob3B0cy5sYWJlbEVycm9yQ2xhc3MpO1xuICAgICQoYC4ke29wdHMuaW5wdXRFcnJvckNsYXNzfWAsICRmb3JtKS5ub3QoJ3NtYWxsJykucmVtb3ZlQ2xhc3Mob3B0cy5pbnB1dEVycm9yQ2xhc3MpO1xuICAgICQoYCR7b3B0cy5mb3JtRXJyb3JTZWxlY3Rvcn0uJHtvcHRzLmZvcm1FcnJvckNsYXNzfWApLnJlbW92ZUNsYXNzKG9wdHMuZm9ybUVycm9yQ2xhc3MpO1xuICAgICRmb3JtLmZpbmQoJ1tkYXRhLWFiaWRlLWVycm9yXScpLmNzcygnZGlzcGxheScsICdub25lJyk7XG4gICAgJCgnOmlucHV0JywgJGZvcm0pLm5vdCgnOmJ1dHRvbiwgOnN1Ym1pdCwgOnJlc2V0LCA6aGlkZGVuLCBbZGF0YS1hYmlkZS1pZ25vcmVdJykudmFsKCcnKS5yZW1vdmVBdHRyKCdkYXRhLWludmFsaWQnKTtcbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBmb3JtIGhhcyBiZWVuIHJlc2V0LlxuICAgICAqIEBldmVudCBBYmlkZSNmb3JtcmVzZXRcbiAgICAgKi9cbiAgICAkZm9ybS50cmlnZ2VyKCdmb3JtcmVzZXQuemYuYWJpZGUnLCBbJGZvcm1dKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiBBYmlkZS5cbiAgICogUmVtb3ZlcyBlcnJvciBzdHlsZXMgYW5kIGNsYXNzZXMgZnJvbSBlbGVtZW50cywgd2l0aG91dCByZXNldHRpbmcgdGhlaXIgdmFsdWVzLlxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5vZmYoJy5hYmlkZScpXG4gICAgICAuZmluZCgnW2RhdGEtYWJpZGUtZXJyb3JdJylcbiAgICAgICAgLmNzcygnZGlzcGxheScsICdub25lJyk7XG5cbiAgICB0aGlzLiRpbnB1dHNcbiAgICAgIC5vZmYoJy5hYmlkZScpXG4gICAgICAuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgX3RoaXMucmVtb3ZlRXJyb3JDbGFzc2VzKCQodGhpcykpO1xuICAgICAgfSk7XG5cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZWZhdWx0IHNldHRpbmdzIGZvciBwbHVnaW5cbiAqL1xuQWJpZGUuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBUaGUgZGVmYXVsdCBldmVudCB0byB2YWxpZGF0ZSBpbnB1dHMuIENoZWNrYm94ZXMgYW5kIHJhZGlvcyB2YWxpZGF0ZSBpbW1lZGlhdGVseS5cbiAgICogUmVtb3ZlIG9yIGNoYW5nZSB0aGlzIHZhbHVlIGZvciBtYW51YWwgdmFsaWRhdGlvbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnZmllbGRDaGFuZ2UnXG4gICAqL1xuICB2YWxpZGF0ZU9uOiAnZmllbGRDaGFuZ2UnLFxuXG4gIC8qKlxuICAgKiBDbGFzcyB0byBiZSBhcHBsaWVkIHRvIGlucHV0IGxhYmVscyBvbiBmYWlsZWQgdmFsaWRhdGlvbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnaXMtaW52YWxpZC1sYWJlbCdcbiAgICovXG4gIGxhYmVsRXJyb3JDbGFzczogJ2lzLWludmFsaWQtbGFiZWwnLFxuXG4gIC8qKlxuICAgKiBDbGFzcyB0byBiZSBhcHBsaWVkIHRvIGlucHV0cyBvbiBmYWlsZWQgdmFsaWRhdGlvbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnaXMtaW52YWxpZC1pbnB1dCdcbiAgICovXG4gIGlucHV0RXJyb3JDbGFzczogJ2lzLWludmFsaWQtaW5wdXQnLFxuXG4gIC8qKlxuICAgKiBDbGFzcyBzZWxlY3RvciB0byB1c2UgdG8gdGFyZ2V0IEZvcm0gRXJyb3JzIGZvciBzaG93L2hpZGUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJy5mb3JtLWVycm9yJ1xuICAgKi9cbiAgZm9ybUVycm9yU2VsZWN0b3I6ICcuZm9ybS1lcnJvcicsXG5cbiAgLyoqXG4gICAqIENsYXNzIGFkZGVkIHRvIEZvcm0gRXJyb3JzIG9uIGZhaWxlZCB2YWxpZGF0aW9uLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdpcy12aXNpYmxlJ1xuICAgKi9cbiAgZm9ybUVycm9yQ2xhc3M6ICdpcy12aXNpYmxlJyxcblxuICAvKipcbiAgICogU2V0IHRvIHRydWUgdG8gdmFsaWRhdGUgdGV4dCBpbnB1dHMgb24gYW55IHZhbHVlIGNoYW5nZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgbGl2ZVZhbGlkYXRlOiBmYWxzZSxcblxuICBwYXR0ZXJuczoge1xuICAgIGFscGhhIDogL15bYS16QS1aXSskLyxcbiAgICBhbHBoYV9udW1lcmljIDogL15bYS16QS1aMC05XSskLyxcbiAgICBpbnRlZ2VyIDogL15bLStdP1xcZCskLyxcbiAgICBudW1iZXIgOiAvXlstK10/XFxkKig/OltcXC5cXCxdXFxkKyk/JC8sXG5cbiAgICAvLyBhbWV4LCB2aXNhLCBkaW5lcnNcbiAgICBjYXJkIDogL14oPzo0WzAtOV17MTJ9KD86WzAtOV17M30pP3w1WzEtNV1bMC05XXsxNH18Nig/OjAxMXw1WzAtOV1bMC05XSlbMC05XXsxMn18M1s0N11bMC05XXsxM318Myg/OjBbMC01XXxbNjhdWzAtOV0pWzAtOV17MTF9fCg/OjIxMzF8MTgwMHwzNVxcZHszfSlcXGR7MTF9KSQvLFxuICAgIGN2diA6IC9eKFswLTldKXszLDR9JC8sXG5cbiAgICAvLyBodHRwOi8vd3d3LndoYXR3Zy5vcmcvc3BlY3Mvd2ViLWFwcHMvY3VycmVudC13b3JrL211bHRpcGFnZS9zdGF0ZXMtb2YtdGhlLXR5cGUtYXR0cmlidXRlLmh0bWwjdmFsaWQtZS1tYWlsLWFkZHJlc3NcbiAgICBlbWFpbCA6IC9eW2EtekEtWjAtOS4hIyQlJicqK1xcLz0/Xl9ge3x9fi1dK0BbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8oPzpcXC5bYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8pKyQvLFxuXG4gICAgdXJsIDogL14oaHR0cHM/fGZ0cHxmaWxlfHNzaCk6XFwvXFwvKCgoKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDopKkApPygoKFxcZHxbMS05XVxcZHwxXFxkXFxkfDJbMC00XVxcZHwyNVswLTVdKVxcLihcXGR8WzEtOV1cXGR8MVxcZFxcZHwyWzAtNF1cXGR8MjVbMC01XSlcXC4oXFxkfFsxLTldXFxkfDFcXGRcXGR8MlswLTRdXFxkfDI1WzAtNV0pXFwuKFxcZHxbMS05XVxcZHwxXFxkXFxkfDJbMC00XVxcZHwyNVswLTVdKSl8KCgoW2EtekEtWl18XFxkfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoKFthLXpBLVpdfFxcZHxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkqKFthLXpBLVpdfFxcZHxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkpKVxcLikrKChbYS16QS1aXXxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KChbYS16QS1aXXxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkqKFthLXpBLVpdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSkpXFwuPykoOlxcZCopPykoXFwvKCgoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KCVbXFxkYS1mXXsyfSl8WyFcXCQmJ1xcKFxcKVxcKlxcKyw7PV18OnxAKSsoXFwvKChbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoJVtcXGRhLWZdezJ9KXxbIVxcJCYnXFwoXFwpXFwqXFwrLDs9XXw6fEApKikqKT8pPyhcXD8oKChbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoJVtcXGRhLWZdezJ9KXxbIVxcJCYnXFwoXFwpXFwqXFwrLDs9XXw6fEApfFtcXHVFMDAwLVxcdUY4RkZdfFxcL3xcXD8pKik/KFxcIygoKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDp8QCl8XFwvfFxcPykqKT8kLyxcbiAgICAvLyBhYmMuZGVcbiAgICBkb21haW4gOiAvXihbYS16QS1aMC05XShbYS16QS1aMC05XFwtXXswLDYxfVthLXpBLVowLTldKT9cXC4pK1thLXpBLVpdezIsOH0kLyxcblxuICAgIGRhdGV0aW1lIDogL14oWzAtMl1bMC05XXszfSlcXC0oWzAtMV1bMC05XSlcXC0oWzAtM11bMC05XSlUKFswLTVdWzAtOV0pXFw6KFswLTVdWzAtOV0pXFw6KFswLTVdWzAtOV0pKFp8KFtcXC1cXCtdKFswLTFdWzAtOV0pXFw6MDApKSQvLFxuICAgIC8vIFlZWVktTU0tRERcbiAgICBkYXRlIDogLyg/OjE5fDIwKVswLTldezJ9LSg/Oig/OjBbMS05XXwxWzAtMl0pLSg/OjBbMS05XXwxWzAtOV18MlswLTldKXwoPzooPyEwMikoPzowWzEtOV18MVswLTJdKS0oPzozMCkpfCg/Oig/OjBbMTM1NzhdfDFbMDJdKS0zMSkpJC8sXG4gICAgLy8gSEg6TU06U1NcbiAgICB0aW1lIDogL14oMFswLTldfDFbMC05XXwyWzAtM10pKDpbMC01XVswLTldKXsyfSQvLFxuICAgIGRhdGVJU08gOiAvXlxcZHs0fVtcXC9cXC1dXFxkezEsMn1bXFwvXFwtXVxcZHsxLDJ9JC8sXG4gICAgLy8gTU0vREQvWVlZWVxuICAgIG1vbnRoX2RheV95ZWFyIDogL14oMFsxLTldfDFbMDEyXSlbLSBcXC8uXSgwWzEtOV18WzEyXVswLTldfDNbMDFdKVstIFxcLy5dXFxkezR9JC8sXG4gICAgLy8gREQvTU0vWVlZWVxuICAgIGRheV9tb250aF95ZWFyIDogL14oMFsxLTldfFsxMl1bMC05XXwzWzAxXSlbLSBcXC8uXSgwWzEtOV18MVswMTJdKVstIFxcLy5dXFxkezR9JC8sXG5cbiAgICAvLyAjRkZGIG9yICNGRkZGRkZcbiAgICBjb2xvciA6IC9eIz8oW2EtZkEtRjAtOV17Nn18W2EtZkEtRjAtOV17M30pJC9cbiAgfSxcblxuICAvKipcbiAgICogT3B0aW9uYWwgdmFsaWRhdGlvbiBmdW5jdGlvbnMgdG8gYmUgdXNlZC4gYGVxdWFsVG9gIGJlaW5nIHRoZSBvbmx5IGRlZmF1bHQgaW5jbHVkZWQgZnVuY3Rpb24uXG4gICAqIEZ1bmN0aW9ucyBzaG91bGQgcmV0dXJuIG9ubHkgYSBib29sZWFuIGlmIHRoZSBpbnB1dCBpcyB2YWxpZCBvciBub3QuIEZ1bmN0aW9ucyBhcmUgZ2l2ZW4gdGhlIGZvbGxvd2luZyBhcmd1bWVudHM6XG4gICAqIGVsIDogVGhlIGpRdWVyeSBlbGVtZW50IHRvIHZhbGlkYXRlLlxuICAgKiByZXF1aXJlZCA6IEJvb2xlYW4gdmFsdWUgb2YgdGhlIHJlcXVpcmVkIGF0dHJpYnV0ZSBiZSBwcmVzZW50IG9yIG5vdC5cbiAgICogcGFyZW50IDogVGhlIGRpcmVjdCBwYXJlbnQgb2YgdGhlIGlucHV0LlxuICAgKiBAb3B0aW9uXG4gICAqL1xuICB2YWxpZGF0b3JzOiB7XG4gICAgZXF1YWxUbzogZnVuY3Rpb24gKGVsLCByZXF1aXJlZCwgcGFyZW50KSB7XG4gICAgICByZXR1cm4gJChgIyR7ZWwuYXR0cignZGF0YS1lcXVhbHRvJyl9YCkudmFsKCkgPT09IGVsLnZhbCgpO1xuICAgIH1cbiAgfVxufVxuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oQWJpZGUsICdBYmlkZScpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogQWNjb3JkaW9uIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5hY2NvcmRpb25cbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uXG4gKi9cblxuY2xhc3MgQWNjb3JkaW9uIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYW4gYWNjb3JkaW9uLlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIEFjY29yZGlvbiNpbml0XG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYW4gYWNjb3JkaW9uLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIGEgcGxhaW4gb2JqZWN0IHdpdGggc2V0dGluZ3MgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHQgb3B0aW9ucy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgQWNjb3JkaW9uLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdBY2NvcmRpb24nKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdBY2NvcmRpb24nLCB7XG4gICAgICAnRU5URVInOiAndG9nZ2xlJyxcbiAgICAgICdTUEFDRSc6ICd0b2dnbGUnLFxuICAgICAgJ0FSUk9XX0RPV04nOiAnbmV4dCcsXG4gICAgICAnQVJST1dfVVAnOiAncHJldmlvdXMnXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIGFjY29yZGlvbiBieSBhbmltYXRpbmcgdGhlIHByZXNldCBhY3RpdmUgcGFuZShzKS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHRoaXMuJGVsZW1lbnQuYXR0cigncm9sZScsICd0YWJsaXN0Jyk7XG4gICAgdGhpcy4kdGFicyA9IHRoaXMuJGVsZW1lbnQuY2hpbGRyZW4oJ2xpLCBbZGF0YS1hY2NvcmRpb24taXRlbV0nKTtcblxuICAgIHRoaXMuJHRhYnMuZWFjaChmdW5jdGlvbihpZHgsIGVsKSB7XG4gICAgICB2YXIgJGVsID0gJChlbCksXG4gICAgICAgICAgJGNvbnRlbnQgPSAkZWwuY2hpbGRyZW4oJ1tkYXRhLXRhYi1jb250ZW50XScpLFxuICAgICAgICAgIGlkID0gJGNvbnRlbnRbMF0uaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnYWNjb3JkaW9uJyksXG4gICAgICAgICAgbGlua0lkID0gZWwuaWQgfHwgYCR7aWR9LWxhYmVsYDtcblxuICAgICAgJGVsLmZpbmQoJ2E6Zmlyc3QnKS5hdHRyKHtcbiAgICAgICAgJ2FyaWEtY29udHJvbHMnOiBpZCxcbiAgICAgICAgJ3JvbGUnOiAndGFiJyxcbiAgICAgICAgJ2lkJzogbGlua0lkLFxuICAgICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlLFxuICAgICAgICAnYXJpYS1zZWxlY3RlZCc6IGZhbHNlXG4gICAgICB9KTtcblxuICAgICAgJGNvbnRlbnQuYXR0cih7J3JvbGUnOiAndGFicGFuZWwnLCAnYXJpYS1sYWJlbGxlZGJ5JzogbGlua0lkLCAnYXJpYS1oaWRkZW4nOiB0cnVlLCAnaWQnOiBpZH0pO1xuICAgIH0pO1xuICAgIHZhciAkaW5pdEFjdGl2ZSA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLmlzLWFjdGl2ZScpLmNoaWxkcmVuKCdbZGF0YS10YWItY29udGVudF0nKTtcbiAgICBpZigkaW5pdEFjdGl2ZS5sZW5ndGgpe1xuICAgICAgdGhpcy5kb3duKCRpbml0QWN0aXZlLCB0cnVlKTtcbiAgICB9XG4gICAgdGhpcy5fZXZlbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyBmb3IgaXRlbXMgd2l0aGluIHRoZSBhY2NvcmRpb24uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLiR0YWJzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJGVsZW0gPSAkKHRoaXMpO1xuICAgICAgdmFyICR0YWJDb250ZW50ID0gJGVsZW0uY2hpbGRyZW4oJ1tkYXRhLXRhYi1jb250ZW50XScpO1xuICAgICAgaWYgKCR0YWJDb250ZW50Lmxlbmd0aCkge1xuICAgICAgICAkZWxlbS5jaGlsZHJlbignYScpLm9mZignY2xpY2suemYuYWNjb3JkaW9uIGtleWRvd24uemYuYWNjb3JkaW9uJylcbiAgICAgICAgICAgICAgIC5vbignY2xpY2suemYuYWNjb3JkaW9uJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyAkKHRoaXMpLmNoaWxkcmVuKCdhJykub24oJ2NsaWNrLnpmLmFjY29yZGlvbicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgaWYgKCRlbGVtLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSkge1xuICAgICAgICAgICAgaWYoX3RoaXMub3B0aW9ucy5hbGxvd0FsbENsb3NlZCB8fCAkZWxlbS5zaWJsaW5ncygpLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSl7XG4gICAgICAgICAgICAgIF90aGlzLnVwKCR0YWJDb250ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBfdGhpcy5kb3duKCR0YWJDb250ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pLm9uKCdrZXlkb3duLnpmLmFjY29yZGlvbicsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdBY2NvcmRpb24nLCB7XG4gICAgICAgICAgICB0b2dnbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBfdGhpcy50b2dnbGUoJHRhYkNvbnRlbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB2YXIgJGEgPSAkZWxlbS5uZXh0KCkuZmluZCgnYScpLmZvY3VzKCk7XG4gICAgICAgICAgICAgIGlmICghX3RoaXMub3B0aW9ucy5tdWx0aUV4cGFuZCkge1xuICAgICAgICAgICAgICAgICRhLnRyaWdnZXIoJ2NsaWNrLnpmLmFjY29yZGlvbicpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2aW91czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHZhciAkYSA9ICRlbGVtLnByZXYoKS5maW5kKCdhJykuZm9jdXMoKTtcbiAgICAgICAgICAgICAgaWYgKCFfdGhpcy5vcHRpb25zLm11bHRpRXhwYW5kKSB7XG4gICAgICAgICAgICAgICAgJGEudHJpZ2dlcignY2xpY2suemYuYWNjb3JkaW9uJylcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhhbmRsZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIHNlbGVjdGVkIGNvbnRlbnQgcGFuZSdzIG9wZW4vY2xvc2Ugc3RhdGUuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0galF1ZXJ5IG9iamVjdCBvZiB0aGUgcGFuZSB0byB0b2dnbGUuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgdG9nZ2xlKCR0YXJnZXQpIHtcbiAgICBpZigkdGFyZ2V0LnBhcmVudCgpLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSkge1xuICAgICAgaWYodGhpcy5vcHRpb25zLmFsbG93QWxsQ2xvc2VkIHx8ICR0YXJnZXQucGFyZW50KCkuc2libGluZ3MoKS5oYXNDbGFzcygnaXMtYWN0aXZlJykpe1xuICAgICAgICB0aGlzLnVwKCR0YXJnZXQpO1xuICAgICAgfSBlbHNlIHsgcmV0dXJuOyB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZG93bigkdGFyZ2V0KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgdGhlIGFjY29yZGlvbiB0YWIgZGVmaW5lZCBieSBgJHRhcmdldGAuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0gQWNjb3JkaW9uIHBhbmUgdG8gb3Blbi5cbiAgICogQHBhcmFtIHtCb29sZWFufSBmaXJzdFRpbWUgLSBmbGFnIHRvIGRldGVybWluZSBpZiByZWZsb3cgc2hvdWxkIGhhcHBlbi5cbiAgICogQGZpcmVzIEFjY29yZGlvbiNkb3duXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZG93bigkdGFyZ2V0LCBmaXJzdFRpbWUpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5tdWx0aUV4cGFuZCAmJiAhZmlyc3RUaW1lKSB7XG4gICAgICB2YXIgJGN1cnJlbnRBY3RpdmUgPSB0aGlzLiRlbGVtZW50LmNoaWxkcmVuKCcuaXMtYWN0aXZlJykuY2hpbGRyZW4oJ1tkYXRhLXRhYi1jb250ZW50XScpO1xuICAgICAgaWYoJGN1cnJlbnRBY3RpdmUubGVuZ3RoKXtcbiAgICAgICAgdGhpcy51cCgkY3VycmVudEFjdGl2ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgJHRhcmdldFxuICAgICAgLmF0dHIoJ2FyaWEtaGlkZGVuJywgZmFsc2UpXG4gICAgICAucGFyZW50KCdbZGF0YS10YWItY29udGVudF0nKVxuICAgICAgLmFkZEJhY2soKVxuICAgICAgLnBhcmVudCgpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcblxuICAgICR0YXJnZXQuc2xpZGVEb3duKHRoaXMub3B0aW9ucy5zbGlkZVNwZWVkLCAoKSA9PiB7XG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIHdoZW4gdGhlIHRhYiBpcyBkb25lIG9wZW5pbmcuXG4gICAgICAgKiBAZXZlbnQgQWNjb3JkaW9uI2Rvd25cbiAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdkb3duLnpmLmFjY29yZGlvbicsIFskdGFyZ2V0XSk7XG4gICAgfSk7XG5cbiAgICAkKGAjJHskdGFyZ2V0LmF0dHIoJ2FyaWEtbGFiZWxsZWRieScpfWApLmF0dHIoe1xuICAgICAgJ2FyaWEtZXhwYW5kZWQnOiB0cnVlLFxuICAgICAgJ2FyaWEtc2VsZWN0ZWQnOiB0cnVlXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2VzIHRoZSB0YWIgZGVmaW5lZCBieSBgJHRhcmdldGAuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0gQWNjb3JkaW9uIHRhYiB0byBjbG9zZS5cbiAgICogQGZpcmVzIEFjY29yZGlvbiN1cFxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHVwKCR0YXJnZXQpIHtcbiAgICB2YXIgJGF1bnRzID0gJHRhcmdldC5wYXJlbnQoKS5zaWJsaW5ncygpLFxuICAgICAgICBfdGhpcyA9IHRoaXM7XG4gICAgdmFyIGNhbkNsb3NlID0gdGhpcy5vcHRpb25zLm11bHRpRXhwYW5kID8gJGF1bnRzLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSA6ICR0YXJnZXQucGFyZW50KCkuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuXG4gICAgaWYoIXRoaXMub3B0aW9ucy5hbGxvd0FsbENsb3NlZCAmJiAhY2FuQ2xvc2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBGb3VuZGF0aW9uLk1vdmUodGhpcy5vcHRpb25zLnNsaWRlU3BlZWQsICR0YXJnZXQsIGZ1bmN0aW9uKCl7XG4gICAgICAkdGFyZ2V0LnNsaWRlVXAoX3RoaXMub3B0aW9ucy5zbGlkZVNwZWVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSB0YWIgaXMgZG9uZSBjb2xsYXBzaW5nIHVwLlxuICAgICAgICAgKiBAZXZlbnQgQWNjb3JkaW9uI3VwXG4gICAgICAgICAqL1xuICAgICAgICBfdGhpcy4kZWxlbWVudC50cmlnZ2VyKCd1cC56Zi5hY2NvcmRpb24nLCBbJHRhcmdldF0pO1xuICAgICAgfSk7XG4gICAgLy8gfSk7XG5cbiAgICAkdGFyZ2V0LmF0dHIoJ2FyaWEtaGlkZGVuJywgdHJ1ZSlcbiAgICAgICAgICAgLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcblxuICAgICQoYCMkeyR0YXJnZXQuYXR0cignYXJpYS1sYWJlbGxlZGJ5Jyl9YCkuYXR0cih7XG4gICAgICdhcmlhLWV4cGFuZGVkJzogZmFsc2UsXG4gICAgICdhcmlhLXNlbGVjdGVkJzogZmFsc2VcbiAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGFuIGFjY29yZGlvbi5cbiAgICogQGZpcmVzIEFjY29yZGlvbiNkZXN0cm95ZWRcbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtdGFiLWNvbnRlbnRdJykuc2xpZGVVcCgwKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdhJykub2ZmKCcuemYuYWNjb3JkaW9uJyk7XG5cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuQWNjb3JkaW9uLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogQW1vdW50IG9mIHRpbWUgdG8gYW5pbWF0ZSB0aGUgb3BlbmluZyBvZiBhbiBhY2NvcmRpb24gcGFuZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAyNTBcbiAgICovXG4gIHNsaWRlU3BlZWQ6IDI1MCxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBhY2NvcmRpb24gdG8gaGF2ZSBtdWx0aXBsZSBvcGVuIHBhbmVzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBtdWx0aUV4cGFuZDogZmFsc2UsXG4gIC8qKlxuICAgKiBBbGxvdyB0aGUgYWNjb3JkaW9uIHRvIGNsb3NlIGFsbCBwYW5lcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgYWxsb3dBbGxDbG9zZWQ6IGZhbHNlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oQWNjb3JkaW9uLCAnQWNjb3JkaW9uJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBBY2NvcmRpb25NZW51IG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5hY2NvcmRpb25NZW51XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5uZXN0XG4gKi9cblxuY2xhc3MgQWNjb3JkaW9uTWVudSB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFuIGFjY29yZGlvbiBtZW51LlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIEFjY29yZGlvbk1lbnUjaW5pdFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGFuIGFjY29yZGlvbiBtZW51LlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIEFjY29yZGlvbk1lbnUuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIEZvdW5kYXRpb24uTmVzdC5GZWF0aGVyKHRoaXMuJGVsZW1lbnQsICdhY2NvcmRpb24nKTtcblxuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0FjY29yZGlvbk1lbnUnKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdBY2NvcmRpb25NZW51Jywge1xuICAgICAgJ0VOVEVSJzogJ3RvZ2dsZScsXG4gICAgICAnU1BBQ0UnOiAndG9nZ2xlJyxcbiAgICAgICdBUlJPV19SSUdIVCc6ICdvcGVuJyxcbiAgICAgICdBUlJPV19VUCc6ICd1cCcsXG4gICAgICAnQVJST1dfRE9XTic6ICdkb3duJyxcbiAgICAgICdBUlJPV19MRUZUJzogJ2Nsb3NlJyxcbiAgICAgICdFU0NBUEUnOiAnY2xvc2VBbGwnLFxuICAgICAgJ1RBQic6ICdkb3duJyxcbiAgICAgICdTSElGVF9UQUInOiAndXAnXG4gICAgfSk7XG4gIH1cblxuXG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBhY2NvcmRpb24gbWVudSBieSBoaWRpbmcgYWxsIG5lc3RlZCBtZW51cy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtc3VibWVudV0nKS5ub3QoJy5pcy1hY3RpdmUnKS5zbGlkZVVwKDApOy8vLmZpbmQoJ2EnKS5jc3MoJ3BhZGRpbmctbGVmdCcsICcxcmVtJyk7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKHtcbiAgICAgICdyb2xlJzogJ3RhYmxpc3QnLFxuICAgICAgJ2FyaWEtbXVsdGlzZWxlY3RhYmxlJzogdGhpcy5vcHRpb25zLm11bHRpT3BlblxuICAgIH0pO1xuXG4gICAgdGhpcy4kbWVudUxpbmtzID0gdGhpcy4kZWxlbWVudC5maW5kKCcuaXMtYWNjb3JkaW9uLXN1Ym1lbnUtcGFyZW50Jyk7XG4gICAgdGhpcy4kbWVudUxpbmtzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgIHZhciBsaW5rSWQgPSB0aGlzLmlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2FjYy1tZW51LWxpbmsnKSxcbiAgICAgICAgICAkZWxlbSA9ICQodGhpcyksXG4gICAgICAgICAgJHN1YiA9ICRlbGVtLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpLFxuICAgICAgICAgIHN1YklkID0gJHN1YlswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdhY2MtbWVudScpLFxuICAgICAgICAgIGlzQWN0aXZlID0gJHN1Yi5oYXNDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAkZWxlbS5hdHRyKHtcbiAgICAgICAgJ2FyaWEtY29udHJvbHMnOiBzdWJJZCxcbiAgICAgICAgJ2FyaWEtZXhwYW5kZWQnOiBpc0FjdGl2ZSxcbiAgICAgICAgJ3JvbGUnOiAndGFiJyxcbiAgICAgICAgJ2lkJzogbGlua0lkXG4gICAgICB9KTtcbiAgICAgICRzdWIuYXR0cih7XG4gICAgICAgICdhcmlhLWxhYmVsbGVkYnknOiBsaW5rSWQsXG4gICAgICAgICdhcmlhLWhpZGRlbic6ICFpc0FjdGl2ZSxcbiAgICAgICAgJ3JvbGUnOiAndGFicGFuZWwnLFxuICAgICAgICAnaWQnOiBzdWJJZFxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgdmFyIGluaXRQYW5lcyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLmlzLWFjdGl2ZScpO1xuICAgIGlmKGluaXRQYW5lcy5sZW5ndGgpe1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgIGluaXRQYW5lcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgIF90aGlzLmRvd24oJCh0aGlzKSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5fZXZlbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyBmb3IgaXRlbXMgd2l0aGluIHRoZSBtZW51LlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdsaScpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJHN1Ym1lbnUgPSAkKHRoaXMpLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpO1xuXG4gICAgICBpZiAoJHN1Ym1lbnUubGVuZ3RoKSB7XG4gICAgICAgICQodGhpcykuY2hpbGRyZW4oJ2EnKS5vZmYoJ2NsaWNrLnpmLmFjY29yZGlvbk1lbnUnKS5vbignY2xpY2suemYuYWNjb3JkaW9uTWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICBfdGhpcy50b2dnbGUoJHN1Ym1lbnUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KS5vbigna2V5ZG93bi56Zi5hY2NvcmRpb25tZW51JywgZnVuY3Rpb24oZSl7XG4gICAgICB2YXIgJGVsZW1lbnQgPSAkKHRoaXMpLFxuICAgICAgICAgICRlbGVtZW50cyA9ICRlbGVtZW50LnBhcmVudCgndWwnKS5jaGlsZHJlbignbGknKSxcbiAgICAgICAgICAkcHJldkVsZW1lbnQsXG4gICAgICAgICAgJG5leHRFbGVtZW50LFxuICAgICAgICAgICR0YXJnZXQgPSAkZWxlbWVudC5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKTtcblxuICAgICAgJGVsZW1lbnRzLmVhY2goZnVuY3Rpb24oaSkge1xuICAgICAgICBpZiAoJCh0aGlzKS5pcygkZWxlbWVudCkpIHtcbiAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkZWxlbWVudHMuZXEoTWF0aC5tYXgoMCwgaS0xKSkuZmluZCgnYScpLmZpcnN0KCk7XG4gICAgICAgICAgJG5leHRFbGVtZW50ID0gJGVsZW1lbnRzLmVxKE1hdGgubWluKGkrMSwgJGVsZW1lbnRzLmxlbmd0aC0xKSkuZmluZCgnYScpLmZpcnN0KCk7XG5cbiAgICAgICAgICBpZiAoJCh0aGlzKS5jaGlsZHJlbignW2RhdGEtc3VibWVudV06dmlzaWJsZScpLmxlbmd0aCkgeyAvLyBoYXMgb3BlbiBzdWIgbWVudVxuICAgICAgICAgICAgJG5leHRFbGVtZW50ID0gJGVsZW1lbnQuZmluZCgnbGk6Zmlyc3QtY2hpbGQnKS5maW5kKCdhJykuZmlyc3QoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCQodGhpcykuaXMoJzpmaXJzdC1jaGlsZCcpKSB7IC8vIGlzIGZpcnN0IGVsZW1lbnQgb2Ygc3ViIG1lbnVcbiAgICAgICAgICAgICRwcmV2RWxlbWVudCA9ICRlbGVtZW50LnBhcmVudHMoJ2xpJykuZmlyc3QoKS5maW5kKCdhJykuZmlyc3QoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKCRwcmV2RWxlbWVudC5jaGlsZHJlbignW2RhdGEtc3VibWVudV06dmlzaWJsZScpLmxlbmd0aCkgeyAvLyBpZiBwcmV2aW91cyBlbGVtZW50IGhhcyBvcGVuIHN1YiBtZW51XG4gICAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkcHJldkVsZW1lbnQuZmluZCgnbGk6bGFzdC1jaGlsZCcpLmZpbmQoJ2EnKS5maXJzdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoJCh0aGlzKS5pcygnOmxhc3QtY2hpbGQnKSkgeyAvLyBpcyBsYXN0IGVsZW1lbnQgb2Ygc3ViIG1lbnVcbiAgICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50LnBhcmVudHMoJ2xpJykuZmlyc3QoKS5uZXh0KCdsaScpLmZpbmQoJ2EnKS5maXJzdCgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnQWNjb3JkaW9uTWVudScsIHtcbiAgICAgICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCR0YXJnZXQuaXMoJzpoaWRkZW4nKSkge1xuICAgICAgICAgICAgX3RoaXMuZG93bigkdGFyZ2V0KTtcbiAgICAgICAgICAgICR0YXJnZXQuZmluZCgnbGknKS5maXJzdCgpLmZpbmQoJ2EnKS5maXJzdCgpLmZvY3VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCR0YXJnZXQubGVuZ3RoICYmICEkdGFyZ2V0LmlzKCc6aGlkZGVuJykpIHsgLy8gY2xvc2UgYWN0aXZlIHN1YiBvZiB0aGlzIGl0ZW1cbiAgICAgICAgICAgIF90aGlzLnVwKCR0YXJnZXQpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoJGVsZW1lbnQucGFyZW50KCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCkgeyAvLyBjbG9zZSBjdXJyZW50bHkgb3BlbiBzdWJcbiAgICAgICAgICAgIF90aGlzLnVwKCRlbGVtZW50LnBhcmVudCgnW2RhdGEtc3VibWVudV0nKSk7XG4gICAgICAgICAgICAkZWxlbWVudC5wYXJlbnRzKCdsaScpLmZpcnN0KCkuZmluZCgnYScpLmZpcnN0KCkuZm9jdXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAkcHJldkVsZW1lbnQuYXR0cigndGFiaW5kZXgnLCAtMSkuZm9jdXMoKTtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIGRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICRuZXh0RWxlbWVudC5hdHRyKCd0YWJpbmRleCcsIC0xKS5mb2N1cygpO1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgdG9nZ2xlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoJGVsZW1lbnQuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKSB7XG4gICAgICAgICAgICBfdGhpcy50b2dnbGUoJGVsZW1lbnQuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2xvc2VBbGw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIF90aGlzLmhpZGVBbGwoKTtcbiAgICAgICAgfSxcbiAgICAgICAgaGFuZGxlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7Ly8uYXR0cigndGFiaW5kZXgnLCAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgYWxsIHBhbmVzIG9mIHRoZSBtZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGhpZGVBbGwoKSB7XG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpLnNsaWRlVXAodGhpcy5vcHRpb25zLnNsaWRlU3BlZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIG9wZW4vY2xvc2Ugc3RhdGUgb2YgYSBzdWJtZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSB0aGUgc3VibWVudSB0byB0b2dnbGVcbiAgICovXG4gIHRvZ2dsZSgkdGFyZ2V0KXtcbiAgICBpZighJHRhcmdldC5pcygnOmFuaW1hdGVkJykpIHtcbiAgICAgIGlmICghJHRhcmdldC5pcygnOmhpZGRlbicpKSB7XG4gICAgICAgIHRoaXMudXAoJHRhcmdldCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5kb3duKCR0YXJnZXQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyB0aGUgc3ViLW1lbnUgZGVmaW5lZCBieSBgJHRhcmdldGAuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0gU3ViLW1lbnUgdG8gb3Blbi5cbiAgICogQGZpcmVzIEFjY29yZGlvbk1lbnUjZG93blxuICAgKi9cbiAgZG93bigkdGFyZ2V0KSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIGlmKCF0aGlzLm9wdGlvbnMubXVsdGlPcGVuKSB7XG4gICAgICB0aGlzLnVwKHRoaXMuJGVsZW1lbnQuZmluZCgnLmlzLWFjdGl2ZScpLm5vdCgkdGFyZ2V0LnBhcmVudHNVbnRpbCh0aGlzLiRlbGVtZW50KS5hZGQoJHRhcmdldCkpKTtcbiAgICB9XG5cbiAgICAkdGFyZ2V0LmFkZENsYXNzKCdpcy1hY3RpdmUnKS5hdHRyKHsnYXJpYS1oaWRkZW4nOiBmYWxzZX0pXG4gICAgICAucGFyZW50KCcuaXMtYWNjb3JkaW9uLXN1Ym1lbnUtcGFyZW50JykuYXR0cih7J2FyaWEtZXhwYW5kZWQnOiB0cnVlfSk7XG5cbiAgICAgIEZvdW5kYXRpb24uTW92ZSh0aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgJHRhcmdldCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICR0YXJnZXQuc2xpZGVEb3duKF90aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG1lbnUgaXMgZG9uZSBvcGVuaW5nLlxuICAgICAgICAgICAqIEBldmVudCBBY2NvcmRpb25NZW51I2Rvd25cbiAgICAgICAgICAgKi9cbiAgICAgICAgICBfdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdkb3duLnpmLmFjY29yZGlvbk1lbnUnLCBbJHRhcmdldF0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgc3ViLW1lbnUgZGVmaW5lZCBieSBgJHRhcmdldGAuIEFsbCBzdWItbWVudXMgaW5zaWRlIHRoZSB0YXJnZXQgd2lsbCBiZSBjbG9zZWQgYXMgd2VsbC5cbiAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSBTdWItbWVudSB0byBjbG9zZS5cbiAgICogQGZpcmVzIEFjY29yZGlvbk1lbnUjdXBcbiAgICovXG4gIHVwKCR0YXJnZXQpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIEZvdW5kYXRpb24uTW92ZSh0aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgJHRhcmdldCwgZnVuY3Rpb24oKXtcbiAgICAgICR0YXJnZXQuc2xpZGVVcChfdGhpcy5vcHRpb25zLnNsaWRlU3BlZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG1lbnUgaXMgZG9uZSBjb2xsYXBzaW5nIHVwLlxuICAgICAgICAgKiBAZXZlbnQgQWNjb3JkaW9uTWVudSN1cFxuICAgICAgICAgKi9cbiAgICAgICAgX3RoaXMuJGVsZW1lbnQudHJpZ2dlcigndXAuemYuYWNjb3JkaW9uTWVudScsIFskdGFyZ2V0XSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHZhciAkbWVudXMgPSAkdGFyZ2V0LmZpbmQoJ1tkYXRhLXN1Ym1lbnVdJykuc2xpZGVVcCgwKS5hZGRCYWNrKCkuYXR0cignYXJpYS1oaWRkZW4nLCB0cnVlKTtcblxuICAgICRtZW51cy5wYXJlbnQoJy5pcy1hY2NvcmRpb24tc3VibWVudS1wYXJlbnQnKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGFjY29yZGlvbiBtZW51LlxuICAgKiBAZmlyZXMgQWNjb3JkaW9uTWVudSNkZXN0cm95ZWRcbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpLnNsaWRlRG93bigwKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdhJykub2ZmKCdjbGljay56Zi5hY2NvcmRpb25NZW51Jyk7XG5cbiAgICBGb3VuZGF0aW9uLk5lc3QuQnVybih0aGlzLiRlbGVtZW50LCAnYWNjb3JkaW9uJyk7XG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cbkFjY29yZGlvbk1lbnUuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSB0byBhbmltYXRlIHRoZSBvcGVuaW5nIG9mIGEgc3VibWVudSBpbiBtcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAyNTBcbiAgICovXG4gIHNsaWRlU3BlZWQ6IDI1MCxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBtZW51IHRvIGhhdmUgbXVsdGlwbGUgb3BlbiBwYW5lcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBtdWx0aU9wZW46IHRydWVcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihBY2NvcmRpb25NZW51LCAnQWNjb3JkaW9uTWVudScpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogRHJpbGxkb3duIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5kcmlsbGRvd25cbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm5lc3RcbiAqL1xuXG5jbGFzcyBEcmlsbGRvd24ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIGRyaWxsZG93biBtZW51LlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhbiBhY2NvcmRpb24gbWVudS5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBEcmlsbGRvd24uZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIEZvdW5kYXRpb24uTmVzdC5GZWF0aGVyKHRoaXMuJGVsZW1lbnQsICdkcmlsbGRvd24nKTtcblxuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0RyaWxsZG93bicpO1xuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ0RyaWxsZG93bicsIHtcbiAgICAgICdFTlRFUic6ICdvcGVuJyxcbiAgICAgICdTUEFDRSc6ICdvcGVuJyxcbiAgICAgICdBUlJPV19SSUdIVCc6ICduZXh0JyxcbiAgICAgICdBUlJPV19VUCc6ICd1cCcsXG4gICAgICAnQVJST1dfRE9XTic6ICdkb3duJyxcbiAgICAgICdBUlJPV19MRUZUJzogJ3ByZXZpb3VzJyxcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnLFxuICAgICAgJ1RBQic6ICdkb3duJyxcbiAgICAgICdTSElGVF9UQUInOiAndXAnXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIGRyaWxsZG93biBieSBjcmVhdGluZyBqUXVlcnkgY29sbGVjdGlvbnMgb2YgZWxlbWVudHNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHRoaXMuJHN1Ym1lbnVBbmNob3JzID0gdGhpcy4kZWxlbWVudC5maW5kKCdsaS5pcy1kcmlsbGRvd24tc3VibWVudS1wYXJlbnQnKS5jaGlsZHJlbignYScpO1xuICAgIHRoaXMuJHN1Ym1lbnVzID0gdGhpcy4kc3VibWVudUFuY2hvcnMucGFyZW50KCdsaScpLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpO1xuICAgIHRoaXMuJG1lbnVJdGVtcyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnbGknKS5ub3QoJy5qcy1kcmlsbGRvd24tYmFjaycpLmF0dHIoJ3JvbGUnLCAnbWVudWl0ZW0nKS5maW5kKCdhJyk7XG5cbiAgICB0aGlzLl9wcmVwYXJlTWVudSgpO1xuXG4gICAgdGhpcy5fa2V5Ym9hcmRFdmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBwcmVwYXJlcyBkcmlsbGRvd24gbWVudSBieSBzZXR0aW5nIGF0dHJpYnV0ZXMgdG8gbGlua3MgYW5kIGVsZW1lbnRzXG4gICAqIHNldHMgYSBtaW4gaGVpZ2h0IHRvIHByZXZlbnQgY29udGVudCBqdW1waW5nXG4gICAqIHdyYXBzIHRoZSBlbGVtZW50IGlmIG5vdCBhbHJlYWR5IHdyYXBwZWRcbiAgICogQHByaXZhdGVcbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBfcHJlcGFyZU1lbnUoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAvLyBpZighdGhpcy5vcHRpb25zLmhvbGRPcGVuKXtcbiAgICAvLyAgIHRoaXMuX21lbnVMaW5rRXZlbnRzKCk7XG4gICAgLy8gfVxuICAgIHRoaXMuJHN1Ym1lbnVBbmNob3JzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgIHZhciAkc3ViID0gJCh0aGlzKTtcbiAgICAgIHZhciAkbGluayA9ICRzdWIuZmluZCgnYTpmaXJzdCcpO1xuICAgICAgaWYoX3RoaXMub3B0aW9ucy5wYXJlbnRMaW5rKXtcbiAgICAgICAgJGxpbmsuY2xvbmUoKS5wcmVwZW5kVG8oJHN1Yi5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKSkud3JhcCgnPGxpIGNsYXNzPVwiaXMtc3VibWVudS1wYXJlbnQtaXRlbSBpcy1zdWJtZW51LWl0ZW0gaXMtZHJpbGxkb3duLXN1Ym1lbnUtaXRlbVwiIHJvbGU9XCJtZW51LWl0ZW1cIj48L2xpPicpO1xuICAgICAgfVxuICAgICAgJGxpbmsuZGF0YSgnc2F2ZWRIcmVmJywgJGxpbmsuYXR0cignaHJlZicpKS5yZW1vdmVBdHRyKCdocmVmJyk7XG4gICAgICAkc3ViLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpXG4gICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgJ2FyaWEtaGlkZGVuJzogdHJ1ZSxcbiAgICAgICAgICAgICd0YWJpbmRleCc6IDAsXG4gICAgICAgICAgICAncm9sZSc6ICdtZW51J1xuICAgICAgICAgIH0pO1xuICAgICAgX3RoaXMuX2V2ZW50cygkc3ViKTtcbiAgICB9KTtcbiAgICB0aGlzLiRzdWJtZW51cy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgJG1lbnUgPSAkKHRoaXMpLFxuICAgICAgICAgICRiYWNrID0gJG1lbnUuZmluZCgnLmpzLWRyaWxsZG93bi1iYWNrJyk7XG4gICAgICBpZighJGJhY2subGVuZ3RoKXtcbiAgICAgICAgJG1lbnUucHJlcGVuZChfdGhpcy5vcHRpb25zLmJhY2tCdXR0b24pO1xuICAgICAgfVxuICAgICAgX3RoaXMuX2JhY2soJG1lbnUpO1xuICAgIH0pO1xuICAgIGlmKCF0aGlzLiRlbGVtZW50LnBhcmVudCgpLmhhc0NsYXNzKCdpcy1kcmlsbGRvd24nKSl7XG4gICAgICB0aGlzLiR3cmFwcGVyID0gJCh0aGlzLm9wdGlvbnMud3JhcHBlcikuYWRkQ2xhc3MoJ2lzLWRyaWxsZG93bicpLmNzcyh0aGlzLl9nZXRNYXhEaW1zKCkpO1xuICAgICAgdGhpcy4kZWxlbWVudC53cmFwKHRoaXMuJHdyYXBwZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIHRvIGVsZW1lbnRzIGluIHRoZSBtZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtIC0gdGhlIGN1cnJlbnQgbWVudSBpdGVtIHRvIGFkZCBoYW5kbGVycyB0by5cbiAgICovXG4gIF9ldmVudHMoJGVsZW0pIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgJGVsZW0ub2ZmKCdjbGljay56Zi5kcmlsbGRvd24nKVxuICAgIC5vbignY2xpY2suemYuZHJpbGxkb3duJywgZnVuY3Rpb24oZSl7XG4gICAgICBpZigkKGUudGFyZ2V0KS5wYXJlbnRzVW50aWwoJ3VsJywgJ2xpJykuaGFzQ2xhc3MoJ2lzLWRyaWxsZG93bi1zdWJtZW51LXBhcmVudCcpKXtcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfVxuXG4gICAgICAvLyBpZihlLnRhcmdldCAhPT0gZS5jdXJyZW50VGFyZ2V0LmZpcnN0RWxlbWVudENoaWxkKXtcbiAgICAgIC8vICAgcmV0dXJuIGZhbHNlO1xuICAgICAgLy8gfVxuICAgICAgX3RoaXMuX3Nob3coJGVsZW0ucGFyZW50KCdsaScpKTtcblxuICAgICAgaWYoX3RoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spe1xuICAgICAgICB2YXIgJGJvZHkgPSAkKCdib2R5Jykubm90KF90aGlzLiR3cmFwcGVyKTtcbiAgICAgICAgJGJvZHkub2ZmKCcuemYuZHJpbGxkb3duJykub24oJ2NsaWNrLnpmLmRyaWxsZG93bicsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBfdGhpcy5faGlkZUFsbCgpO1xuICAgICAgICAgICRib2R5Lm9mZignLnpmLmRyaWxsZG93bicpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGtleWRvd24gZXZlbnQgbGlzdGVuZXIgdG8gYGxpYCdzIGluIHRoZSBtZW51LlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2tleWJvYXJkRXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgXG4gICAgdGhpcy4kbWVudUl0ZW1zLmFkZCh0aGlzLiRlbGVtZW50LmZpbmQoJy5qcy1kcmlsbGRvd24tYmFjayA+IGEnKSkub24oJ2tleWRvd24uemYuZHJpbGxkb3duJywgZnVuY3Rpb24oZSl7XG4gICAgICBcbiAgICAgIHZhciAkZWxlbWVudCA9ICQodGhpcyksXG4gICAgICAgICAgJGVsZW1lbnRzID0gJGVsZW1lbnQucGFyZW50KCdsaScpLnBhcmVudCgndWwnKS5jaGlsZHJlbignbGknKS5jaGlsZHJlbignYScpLFxuICAgICAgICAgICRwcmV2RWxlbWVudCxcbiAgICAgICAgICAkbmV4dEVsZW1lbnQ7XG5cbiAgICAgICRlbGVtZW50cy5lYWNoKGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgaWYgKCQodGhpcykuaXMoJGVsZW1lbnQpKSB7XG4gICAgICAgICAgJHByZXZFbGVtZW50ID0gJGVsZW1lbnRzLmVxKE1hdGgubWF4KDAsIGktMSkpO1xuICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50cy5lcShNYXRoLm1pbihpKzEsICRlbGVtZW50cy5sZW5ndGgtMSkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdEcmlsbGRvd24nLCB7XG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICgkZWxlbWVudC5pcyhfdGhpcy4kc3VibWVudUFuY2hvcnMpKSB7XG4gICAgICAgICAgICBfdGhpcy5fc2hvdygkZWxlbWVudC5wYXJlbnQoJ2xpJykpO1xuICAgICAgICAgICAgJGVsZW1lbnQucGFyZW50KCdsaScpLm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoJGVsZW1lbnQpLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAkZWxlbWVudC5wYXJlbnQoJ2xpJykuZmluZCgndWwgbGkgYScpLmZpbHRlcihfdGhpcy4kbWVudUl0ZW1zKS5maXJzdCgpLmZvY3VzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHByZXZpb3VzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy5faGlkZSgkZWxlbWVudC5wYXJlbnQoJ2xpJykucGFyZW50KCd1bCcpKTtcbiAgICAgICAgICAkZWxlbWVudC5wYXJlbnQoJ2xpJykucGFyZW50KCd1bCcpLm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoJGVsZW1lbnQpLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgJGVsZW1lbnQucGFyZW50KCdsaScpLnBhcmVudCgndWwnKS5wYXJlbnQoJ2xpJykuY2hpbGRyZW4oJ2EnKS5maXJzdCgpLmZvY3VzKCk7XG4gICAgICAgICAgICB9LCAxKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAkcHJldkVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0sXG4gICAgICAgIGRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICRuZXh0RWxlbWVudC5mb2N1cygpO1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIF90aGlzLl9iYWNrKCk7XG4gICAgICAgICAgLy9fdGhpcy4kbWVudUl0ZW1zLmZpcnN0KCkuZm9jdXMoKTsgLy8gZm9jdXMgdG8gZmlyc3QgZWxlbWVudFxuICAgICAgICB9LFxuICAgICAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoISRlbGVtZW50LmlzKF90aGlzLiRtZW51SXRlbXMpKSB7IC8vIG5vdCBtZW51IGl0ZW0gbWVhbnMgYmFjayBidXR0b25cbiAgICAgICAgICAgIF90aGlzLl9oaWRlKCRlbGVtZW50LnBhcmVudCgnbGknKS5wYXJlbnQoJ3VsJykpO1xuICAgICAgICAgICAgJGVsZW1lbnQucGFyZW50KCdsaScpLnBhcmVudCgndWwnKS5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKCRlbGVtZW50KSwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkZWxlbWVudC5wYXJlbnQoJ2xpJykucGFyZW50KCd1bCcpLnBhcmVudCgnbGknKS5jaGlsZHJlbignYScpLmZpcnN0KCkuZm9jdXMoKTtcbiAgICAgICAgICAgICAgfSwgMSk7XG4gICAgICAgICAgICB9KTsgICAgICAgICAgICBcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKCRlbGVtZW50LmlzKF90aGlzLiRzdWJtZW51QW5jaG9ycykpIHtcbiAgICAgICAgICAgIF90aGlzLl9zaG93KCRlbGVtZW50LnBhcmVudCgnbGknKSk7XG4gICAgICAgICAgICAkZWxlbWVudC5wYXJlbnQoJ2xpJykub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZCgkZWxlbWVudCksIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICRlbGVtZW50LnBhcmVudCgnbGknKS5maW5kKCd1bCBsaSBhJykuZmlsdGVyKF90aGlzLiRtZW51SXRlbXMpLmZpcnN0KCkuZm9jdXMoKTtcbiAgICAgICAgICAgIH0pOyAgICAgICAgICAgIFxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaGFuZGxlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7IC8vIGVuZCBrZXlib2FyZEFjY2Vzc1xuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyBhbGwgb3BlbiBlbGVtZW50cywgYW5kIHJldHVybnMgdG8gcm9vdCBtZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIERyaWxsZG93biNjbG9zZWRcbiAgICovXG4gIF9oaWRlQWxsKCkge1xuICAgIHZhciAkZWxlbSA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLmlzLWRyaWxsZG93bi1zdWJtZW51LmlzLWFjdGl2ZScpLmFkZENsYXNzKCdpcy1jbG9zaW5nJyk7XG4gICAgJGVsZW0ub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZCgkZWxlbSksIGZ1bmN0aW9uKGUpe1xuICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZSBpcy1jbG9zaW5nJyk7XG4gICAgfSk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBtZW51IGlzIGZ1bGx5IGNsb3NlZC5cbiAgICAgICAgICogQGV2ZW50IERyaWxsZG93biNjbG9zZWRcbiAgICAgICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdjbG9zZWQuemYuZHJpbGxkb3duJyk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBsaXN0ZW5lciBmb3IgZWFjaCBgYmFja2AgYnV0dG9uLCBhbmQgY2xvc2VzIG9wZW4gbWVudXMuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAZmlyZXMgRHJpbGxkb3duI2JhY2tcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtIC0gdGhlIGN1cnJlbnQgc3ViLW1lbnUgdG8gYWRkIGBiYWNrYCBldmVudC5cbiAgICovXG4gIF9iYWNrKCRlbGVtKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAkZWxlbS5vZmYoJ2NsaWNrLnpmLmRyaWxsZG93bicpO1xuICAgICRlbGVtLmNoaWxkcmVuKCcuanMtZHJpbGxkb3duLWJhY2snKVxuICAgICAgLm9uKCdjbGljay56Zi5kcmlsbGRvd24nLCBmdW5jdGlvbihlKXtcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ21vdXNldXAgb24gYmFjaycpO1xuICAgICAgICBfdGhpcy5faGlkZSgkZWxlbSk7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV2ZW50IGxpc3RlbmVyIHRvIG1lbnUgaXRlbXMgdy9vIHN1Ym1lbnVzIHRvIGNsb3NlIG9wZW4gbWVudXMgb24gY2xpY2suXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX21lbnVMaW5rRXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy4kbWVudUl0ZW1zLm5vdCgnLmlzLWRyaWxsZG93bi1zdWJtZW51LXBhcmVudCcpXG4gICAgICAgIC5vZmYoJ2NsaWNrLnpmLmRyaWxsZG93bicpXG4gICAgICAgIC5vbignY2xpY2suemYuZHJpbGxkb3duJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgLy8gZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBfdGhpcy5faGlkZUFsbCgpO1xuICAgICAgICAgIH0sIDApO1xuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgYSBzdWJtZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIERyaWxsZG93biNvcGVuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbSAtIHRoZSBjdXJyZW50IGVsZW1lbnQgd2l0aCBhIHN1Ym1lbnUgdG8gb3BlbiwgaS5lLiB0aGUgYGxpYCB0YWcuXG4gICAqL1xuICBfc2hvdygkZWxlbSkge1xuICAgICRlbGVtLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcblxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignb3Blbi56Zi5kcmlsbGRvd24nLCBbJGVsZW1dKTtcbiAgfTtcblxuICAvKipcbiAgICogSGlkZXMgYSBzdWJtZW51XG4gICAqIEBmdW5jdGlvblxuICAgKiBAZmlyZXMgRHJpbGxkb3duI2hpZGVcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtIC0gdGhlIGN1cnJlbnQgc3ViLW1lbnUgdG8gaGlkZSwgaS5lLiB0aGUgYHVsYCB0YWcuXG4gICAqL1xuICBfaGlkZSgkZWxlbSkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgJGVsZW0uYWRkQ2xhc3MoJ2lzLWNsb3NpbmcnKVxuICAgICAgICAgLm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoJGVsZW0pLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAkZWxlbS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlIGlzLWNsb3NpbmcnKTtcbiAgICAgICAgICAgJGVsZW0uYmx1cigpO1xuICAgICAgICAgfSk7XG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgc3VibWVudSBpcyBoYXMgY2xvc2VkLlxuICAgICAqIEBldmVudCBEcmlsbGRvd24jaGlkZVxuICAgICAqL1xuICAgICRlbGVtLnRyaWdnZXIoJ2hpZGUuemYuZHJpbGxkb3duJywgWyRlbGVtXSk7XG4gIH1cblxuICAvKipcbiAgICogSXRlcmF0ZXMgdGhyb3VnaCB0aGUgbmVzdGVkIG1lbnVzIHRvIGNhbGN1bGF0ZSB0aGUgbWluLWhlaWdodCwgYW5kIG1heC13aWR0aCBmb3IgdGhlIG1lbnUuXG4gICAqIFByZXZlbnRzIGNvbnRlbnQganVtcGluZy5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZ2V0TWF4RGltcygpIHtcbiAgICB2YXIgbWF4ID0gMCwgcmVzdWx0ID0ge307XG4gICAgdGhpcy4kc3VibWVudXMuYWRkKHRoaXMuJGVsZW1lbnQpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgIHZhciBudW1PZkVsZW1zID0gJCh0aGlzKS5jaGlsZHJlbignbGknKS5sZW5ndGg7XG4gICAgICBtYXggPSBudW1PZkVsZW1zID4gbWF4ID8gbnVtT2ZFbGVtcyA6IG1heDtcbiAgICB9KTtcblxuICAgIHJlc3VsdFsnbWluLWhlaWdodCddID0gYCR7bWF4ICogdGhpcy4kbWVudUl0ZW1zWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodH1weGA7XG4gICAgcmVzdWx0WydtYXgtd2lkdGgnXSA9IGAke3RoaXMuJGVsZW1lbnRbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGh9cHhgO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgRHJpbGxkb3duIE1lbnVcbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuX2hpZGVBbGwoKTtcbiAgICBGb3VuZGF0aW9uLk5lc3QuQnVybih0aGlzLiRlbGVtZW50LCAnZHJpbGxkb3duJyk7XG4gICAgdGhpcy4kZWxlbWVudC51bndyYXAoKVxuICAgICAgICAgICAgICAgICAuZmluZCgnLmpzLWRyaWxsZG93bi1iYWNrLCAuaXMtc3VibWVudS1wYXJlbnQtaXRlbScpLnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgIC5lbmQoKS5maW5kKCcuaXMtYWN0aXZlLCAuaXMtY2xvc2luZywgLmlzLWRyaWxsZG93bi1zdWJtZW51JykucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZSBpcy1jbG9zaW5nIGlzLWRyaWxsZG93bi1zdWJtZW51JylcbiAgICAgICAgICAgICAgICAgLmVuZCgpLmZpbmQoJ1tkYXRhLXN1Ym1lbnVdJykucmVtb3ZlQXR0cignYXJpYS1oaWRkZW4gdGFiaW5kZXggcm9sZScpXG4gICAgICAgICAgICAgICAgIC5vZmYoJy56Zi5kcmlsbGRvd24nKS5lbmQoKS5vZmYoJ3pmLmRyaWxsZG93bicpO1xuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnYScpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgIHZhciAkbGluayA9ICQodGhpcyk7XG4gICAgICBpZigkbGluay5kYXRhKCdzYXZlZEhyZWYnKSl7XG4gICAgICAgICRsaW5rLmF0dHIoJ2hyZWYnLCAkbGluay5kYXRhKCdzYXZlZEhyZWYnKSkucmVtb3ZlRGF0YSgnc2F2ZWRIcmVmJyk7XG4gICAgICB9ZWxzZXsgcmV0dXJuOyB9XG4gICAgfSk7XG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9O1xufVxuXG5EcmlsbGRvd24uZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBNYXJrdXAgdXNlZCBmb3IgSlMgZ2VuZXJhdGVkIGJhY2sgYnV0dG9uLiBQcmVwZW5kZWQgdG8gc3VibWVudSBsaXN0cyBhbmQgZGVsZXRlZCBvbiBgZGVzdHJveWAgbWV0aG9kLCAnanMtZHJpbGxkb3duLWJhY2snIGNsYXNzIHJlcXVpcmVkLiBSZW1vdmUgdGhlIGJhY2tzbGFzaCAoYFxcYCkgaWYgY29weSBhbmQgcGFzdGluZy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnPFxcbGk+PFxcYT5CYWNrPFxcL2E+PFxcL2xpPidcbiAgICovXG4gIGJhY2tCdXR0b246ICc8bGkgY2xhc3M9XCJqcy1kcmlsbGRvd24tYmFja1wiPjxhIHRhYmluZGV4PVwiMFwiPkJhY2s8L2E+PC9saT4nLFxuICAvKipcbiAgICogTWFya3VwIHVzZWQgdG8gd3JhcCBkcmlsbGRvd24gbWVudS4gVXNlIGEgY2xhc3MgbmFtZSBmb3IgaW5kZXBlbmRlbnQgc3R5bGluZzsgdGhlIEpTIGFwcGxpZWQgY2xhc3M6IGBpcy1kcmlsbGRvd25gIGlzIHJlcXVpcmVkLiBSZW1vdmUgdGhlIGJhY2tzbGFzaCAoYFxcYCkgaWYgY29weSBhbmQgcGFzdGluZy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnPFxcZGl2IGNsYXNzPVwiaXMtZHJpbGxkb3duXCI+PFxcL2Rpdj4nXG4gICAqL1xuICB3cmFwcGVyOiAnPGRpdj48L2Rpdj4nLFxuICAvKipcbiAgICogQWRkcyB0aGUgcGFyZW50IGxpbmsgdG8gdGhlIHN1Ym1lbnUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIHBhcmVudExpbms6IGZhbHNlLFxuICAvKipcbiAgICogQWxsb3cgdGhlIG1lbnUgdG8gcmV0dXJuIHRvIHJvb3QgbGlzdCBvbiBib2R5IGNsaWNrLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBjbG9zZU9uQ2xpY2s6IGZhbHNlXG4gIC8vIGhvbGRPcGVuOiBmYWxzZVxufTtcblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKERyaWxsZG93biwgJ0RyaWxsZG93bicpO1xuXG59KGpRdWVyeSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIERyb3Bkb3duIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5kcm9wZG93blxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5ib3hcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcbiAqL1xuXG5jbGFzcyBEcm9wZG93biB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGEgZHJvcGRvd24uXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGEgZHJvcGRvd24uXG4gICAqICAgICAgICBPYmplY3Qgc2hvdWxkIGJlIG9mIHRoZSBkcm9wZG93biBwYW5lbCwgcmF0aGVyIHRoYW4gaXRzIGFuY2hvci5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBEcm9wZG93bi5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0Ryb3Bkb3duJyk7XG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignRHJvcGRvd24nLCB7XG4gICAgICAnRU5URVInOiAnb3BlbicsXG4gICAgICAnU1BBQ0UnOiAnb3BlbicsXG4gICAgICAnRVNDQVBFJzogJ2Nsb3NlJyxcbiAgICAgICdUQUInOiAndGFiX2ZvcndhcmQnLFxuICAgICAgJ1NISUZUX1RBQic6ICd0YWJfYmFja3dhcmQnXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHBsdWdpbiBieSBzZXR0aW5nL2NoZWNraW5nIG9wdGlvbnMgYW5kIGF0dHJpYnV0ZXMsIGFkZGluZyBoZWxwZXIgdmFyaWFibGVzLCBhbmQgc2F2aW5nIHRoZSBhbmNob3IuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyICRpZCA9IHRoaXMuJGVsZW1lbnQuYXR0cignaWQnKTtcblxuICAgIHRoaXMuJGFuY2hvciA9ICQoYFtkYXRhLXRvZ2dsZT1cIiR7JGlkfVwiXWApIHx8ICQoYFtkYXRhLW9wZW49XCIkeyRpZH1cIl1gKTtcbiAgICB0aGlzLiRhbmNob3IuYXR0cih7XG4gICAgICAnYXJpYS1jb250cm9scyc6ICRpZCxcbiAgICAgICdkYXRhLWlzLWZvY3VzJzogZmFsc2UsXG4gICAgICAnZGF0YS15ZXRpLWJveCc6ICRpZCxcbiAgICAgICdhcmlhLWhhc3BvcHVwJzogdHJ1ZSxcbiAgICAgICdhcmlhLWV4cGFuZGVkJzogZmFsc2VcblxuICAgIH0pO1xuXG4gICAgdGhpcy5vcHRpb25zLnBvc2l0aW9uQ2xhc3MgPSB0aGlzLmdldFBvc2l0aW9uQ2xhc3MoKTtcbiAgICB0aGlzLmNvdW50ZXIgPSA0O1xuICAgIHRoaXMudXNlZFBvc2l0aW9ucyA9IFtdO1xuICAgIHRoaXMuJGVsZW1lbnQuYXR0cih7XG4gICAgICAnYXJpYS1oaWRkZW4nOiAndHJ1ZScsXG4gICAgICAnZGF0YS15ZXRpLWJveCc6ICRpZCxcbiAgICAgICdkYXRhLXJlc2l6ZSc6ICRpZCxcbiAgICAgICdhcmlhLWxhYmVsbGVkYnknOiB0aGlzLiRhbmNob3JbMF0uaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnZGQtYW5jaG9yJylcbiAgICB9KTtcbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIGN1cnJlbnQgb3JpZW50YXRpb24gb2YgZHJvcGRvd24gcGFuZS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IHBvc2l0aW9uIC0gc3RyaW5nIHZhbHVlIG9mIGEgcG9zaXRpb24gY2xhc3MuXG4gICAqL1xuICBnZXRQb3NpdGlvbkNsYXNzKCkge1xuICAgIHZhciB2ZXJ0aWNhbFBvc2l0aW9uID0gdGhpcy4kZWxlbWVudFswXS5jbGFzc05hbWUubWF0Y2goLyh0b3B8bGVmdHxyaWdodHxib3R0b20pL2cpO1xuICAgICAgICB2ZXJ0aWNhbFBvc2l0aW9uID0gdmVydGljYWxQb3NpdGlvbiA/IHZlcnRpY2FsUG9zaXRpb25bMF0gOiAnJztcbiAgICB2YXIgaG9yaXpvbnRhbFBvc2l0aW9uID0gL2Zsb2F0LSguKylcXHMvLmV4ZWModGhpcy4kYW5jaG9yWzBdLmNsYXNzTmFtZSk7XG4gICAgICAgIGhvcml6b250YWxQb3NpdGlvbiA9IGhvcml6b250YWxQb3NpdGlvbiA/IGhvcml6b250YWxQb3NpdGlvblsxXSA6ICcnO1xuICAgIHZhciBwb3NpdGlvbiA9IGhvcml6b250YWxQb3NpdGlvbiA/IGhvcml6b250YWxQb3NpdGlvbiArICcgJyArIHZlcnRpY2FsUG9zaXRpb24gOiB2ZXJ0aWNhbFBvc2l0aW9uO1xuICAgIHJldHVybiBwb3NpdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGp1c3RzIHRoZSBkcm9wZG93biBwYW5lcyBvcmllbnRhdGlvbiBieSBhZGRpbmcvcmVtb3ZpbmcgcG9zaXRpb25pbmcgY2xhc3Nlcy5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwb3NpdGlvbiAtIHBvc2l0aW9uIGNsYXNzIHRvIHJlbW92ZS5cbiAgICovXG4gIF9yZXBvc2l0aW9uKHBvc2l0aW9uKSB7XG4gICAgdGhpcy51c2VkUG9zaXRpb25zLnB1c2gocG9zaXRpb24gPyBwb3NpdGlvbiA6ICdib3R0b20nKTtcbiAgICAvL2RlZmF1bHQsIHRyeSBzd2l0Y2hpbmcgdG8gb3Bwb3NpdGUgc2lkZVxuICAgIGlmKCFwb3NpdGlvbiAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3RvcCcpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcygndG9wJyk7XG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICd0b3AnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignYm90dG9tJykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ2xlZnQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigncmlnaHQnKSA8IDApKXtcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pXG4gICAgICAgICAgLmFkZENsYXNzKCdyaWdodCcpO1xuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAncmlnaHQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbilcbiAgICAgICAgICAuYWRkQ2xhc3MoJ2xlZnQnKTtcbiAgICB9XG5cbiAgICAvL2lmIGRlZmF1bHQgY2hhbmdlIGRpZG4ndCB3b3JrLCB0cnkgYm90dG9tIG9yIGxlZnQgZmlyc3RcbiAgICBlbHNlIGlmKCFwb3NpdGlvbiAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3RvcCcpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcygnbGVmdCcpO1xuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAndG9wJyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbilcbiAgICAgICAgICAuYWRkQ2xhc3MoJ2xlZnQnKTtcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ2xlZnQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigncmlnaHQnKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbik7XG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICdyaWdodCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA8IDApKXtcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xuICAgIH1cbiAgICAvL2lmIG5vdGhpbmcgY2xlYXJlZCwgc2V0IHRvIGJvdHRvbVxuICAgIGVsc2V7XG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcbiAgICB9XG4gICAgdGhpcy5jbGFzc0NoYW5nZWQgPSB0cnVlO1xuICAgIHRoaXMuY291bnRlci0tO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHBvc2l0aW9uIGFuZCBvcmllbnRhdGlvbiBvZiB0aGUgZHJvcGRvd24gcGFuZSwgY2hlY2tzIGZvciBjb2xsaXNpb25zLlxuICAgKiBSZWN1cnNpdmVseSBjYWxscyBpdHNlbGYgaWYgYSBjb2xsaXNpb24gaXMgZGV0ZWN0ZWQsIHdpdGggYSBuZXcgcG9zaXRpb24gY2xhc3MuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3NldFBvc2l0aW9uKCkge1xuICAgIGlmKHRoaXMuJGFuY2hvci5hdHRyKCdhcmlhLWV4cGFuZGVkJykgPT09ICdmYWxzZScpeyByZXR1cm4gZmFsc2U7IH1cbiAgICB2YXIgcG9zaXRpb24gPSB0aGlzLmdldFBvc2l0aW9uQ2xhc3MoKSxcbiAgICAgICAgJGVsZURpbXMgPSBGb3VuZGF0aW9uLkJveC5HZXREaW1lbnNpb25zKHRoaXMuJGVsZW1lbnQpLFxuICAgICAgICAkYW5jaG9yRGltcyA9IEZvdW5kYXRpb24uQm94LkdldERpbWVuc2lvbnModGhpcy4kYW5jaG9yKSxcbiAgICAgICAgX3RoaXMgPSB0aGlzLFxuICAgICAgICBkaXJlY3Rpb24gPSAocG9zaXRpb24gPT09ICdsZWZ0JyA/ICdsZWZ0JyA6ICgocG9zaXRpb24gPT09ICdyaWdodCcpID8gJ2xlZnQnIDogJ3RvcCcpKSxcbiAgICAgICAgcGFyYW0gPSAoZGlyZWN0aW9uID09PSAndG9wJykgPyAnaGVpZ2h0JyA6ICd3aWR0aCcsXG4gICAgICAgIG9mZnNldCA9IChwYXJhbSA9PT0gJ2hlaWdodCcpID8gdGhpcy5vcHRpb25zLnZPZmZzZXQgOiB0aGlzLm9wdGlvbnMuaE9mZnNldDtcblxuXG5cbiAgICBpZigoJGVsZURpbXMud2lkdGggPj0gJGVsZURpbXMud2luZG93RGltcy53aWR0aCkgfHwgKCF0aGlzLmNvdW50ZXIgJiYgIUZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UodGhpcy4kZWxlbWVudCkpKXtcbiAgICAgIHRoaXMuJGVsZW1lbnQub2Zmc2V0KEZvdW5kYXRpb24uQm94LkdldE9mZnNldHModGhpcy4kZWxlbWVudCwgdGhpcy4kYW5jaG9yLCAnY2VudGVyIGJvdHRvbScsIHRoaXMub3B0aW9ucy52T2Zmc2V0LCB0aGlzLm9wdGlvbnMuaE9mZnNldCwgdHJ1ZSkpLmNzcyh7XG4gICAgICAgICd3aWR0aCc6ICRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLSAodGhpcy5vcHRpb25zLmhPZmZzZXQgKiAyKSxcbiAgICAgICAgJ2hlaWdodCc6ICdhdXRvJ1xuICAgICAgfSk7XG4gICAgICB0aGlzLmNsYXNzQ2hhbmdlZCA9IHRydWU7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy4kZWxlbWVudC5vZmZzZXQoRm91bmRhdGlvbi5Cb3guR2V0T2Zmc2V0cyh0aGlzLiRlbGVtZW50LCB0aGlzLiRhbmNob3IsIHBvc2l0aW9uLCB0aGlzLm9wdGlvbnMudk9mZnNldCwgdGhpcy5vcHRpb25zLmhPZmZzZXQpKTtcblxuICAgIHdoaWxlKCFGb3VuZGF0aW9uLkJveC5JbU5vdFRvdWNoaW5nWW91KHRoaXMuJGVsZW1lbnQsIGZhbHNlLCB0cnVlKSAmJiB0aGlzLmNvdW50ZXIpe1xuICAgICAgdGhpcy5fcmVwb3NpdGlvbihwb3NpdGlvbik7XG4gICAgICB0aGlzLl9zZXRQb3NpdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV2ZW50IGxpc3RlbmVycyB0byB0aGUgZWxlbWVudCB1dGlsaXppbmcgdGhlIHRyaWdnZXJzIHV0aWxpdHkgbGlicmFyeS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy4kZWxlbWVudC5vbih7XG4gICAgICAnb3Blbi56Zi50cmlnZ2VyJzogdGhpcy5vcGVuLmJpbmQodGhpcyksXG4gICAgICAnY2xvc2UuemYudHJpZ2dlcic6IHRoaXMuY2xvc2UuYmluZCh0aGlzKSxcbiAgICAgICd0b2dnbGUuemYudHJpZ2dlcic6IHRoaXMudG9nZ2xlLmJpbmQodGhpcyksXG4gICAgICAncmVzaXplbWUuemYudHJpZ2dlcic6IHRoaXMuX3NldFBvc2l0aW9uLmJpbmQodGhpcylcbiAgICB9KTtcblxuICAgIGlmKHRoaXMub3B0aW9ucy5ob3Zlcil7XG4gICAgICB0aGlzLiRhbmNob3Iub2ZmKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3duIG1vdXNlbGVhdmUuemYuZHJvcGRvd24nKVxuICAgICAgICAgIC5vbignbW91c2VlbnRlci56Zi5kcm9wZG93bicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoX3RoaXMudGltZW91dCk7XG4gICAgICAgICAgICBfdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICBfdGhpcy5vcGVuKCk7XG4gICAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZGF0YSgnaG92ZXInLCB0cnVlKTtcbiAgICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuaG92ZXJEZWxheSk7XG4gICAgICAgICAgfSkub24oJ21vdXNlbGVhdmUuemYuZHJvcGRvd24nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLnRpbWVvdXQpO1xuICAgICAgICAgICAgX3RoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgICAgX3RoaXMuJGFuY2hvci5kYXRhKCdob3ZlcicsIGZhbHNlKTtcbiAgICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuaG92ZXJEZWxheSk7XG4gICAgICAgICAgfSk7XG4gICAgICBpZih0aGlzLm9wdGlvbnMuaG92ZXJQYW5lKXtcbiAgICAgICAgdGhpcy4kZWxlbWVudC5vZmYoJ21vdXNlZW50ZXIuemYuZHJvcGRvd24gbW91c2VsZWF2ZS56Zi5kcm9wZG93bicpXG4gICAgICAgICAgICAub24oJ21vdXNlZW50ZXIuemYuZHJvcGRvd24nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoX3RoaXMudGltZW91dCk7XG4gICAgICAgICAgICB9KS5vbignbW91c2VsZWF2ZS56Zi5kcm9wZG93bicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcbiAgICAgICAgICAgICAgX3RoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZGF0YSgnaG92ZXInLCBmYWxzZSk7XG4gICAgICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuaG92ZXJEZWxheSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy4kYW5jaG9yLmFkZCh0aGlzLiRlbGVtZW50KS5vbigna2V5ZG93bi56Zi5kcm9wZG93bicsIGZ1bmN0aW9uKGUpIHtcblxuICAgICAgdmFyICR0YXJnZXQgPSAkKHRoaXMpLFxuICAgICAgICB2aXNpYmxlRm9jdXNhYmxlRWxlbWVudHMgPSBGb3VuZGF0aW9uLktleWJvYXJkLmZpbmRGb2N1c2FibGUoX3RoaXMuJGVsZW1lbnQpO1xuXG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnRHJvcGRvd24nLCB7XG4gICAgICAgIHRhYl9mb3J3YXJkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoX3RoaXMuJGVsZW1lbnQuZmluZCgnOmZvY3VzJykuaXModmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzLmVxKC0xKSkpIHsgLy8gbGVmdCBtb2RhbCBkb3dud2FyZHMsIHNldHRpbmcgZm9jdXMgdG8gZmlyc3QgZWxlbWVudFxuICAgICAgICAgICAgaWYgKF90aGlzLm9wdGlvbnMudHJhcEZvY3VzKSB7IC8vIGlmIGZvY3VzIHNoYWxsIGJlIHRyYXBwZWRcbiAgICAgICAgICAgICAgdmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzLmVxKDApLmZvY3VzKCk7XG4gICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7IC8vIGlmIGZvY3VzIGlzIG5vdCB0cmFwcGVkLCBjbG9zZSBkcm9wZG93biBvbiBmb2N1cyBvdXRcbiAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRhYl9iYWNrd2FyZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKF90aGlzLiRlbGVtZW50LmZpbmQoJzpmb2N1cycpLmlzKHZpc2libGVGb2N1c2FibGVFbGVtZW50cy5lcSgwKSkgfHwgX3RoaXMuJGVsZW1lbnQuaXMoJzpmb2N1cycpKSB7IC8vIGxlZnQgbW9kYWwgdXB3YXJkcywgc2V0dGluZyBmb2N1cyB0byBsYXN0IGVsZW1lbnRcbiAgICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLnRyYXBGb2N1cykgeyAvLyBpZiBmb2N1cyBzaGFsbCBiZSB0cmFwcGVkXG4gICAgICAgICAgICAgIHZpc2libGVGb2N1c2FibGVFbGVtZW50cy5lcSgtMSkuZm9jdXMoKTtcbiAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfSBlbHNlIHsgLy8gaWYgZm9jdXMgaXMgbm90IHRyYXBwZWQsIGNsb3NlIGRyb3Bkb3duIG9uIGZvY3VzIG91dFxuICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCR0YXJnZXQuaXMoX3RoaXMuJGFuY2hvcikpIHtcbiAgICAgICAgICAgIF90aGlzLm9wZW4oKTtcbiAgICAgICAgICAgIF90aGlzLiRlbGVtZW50LmF0dHIoJ3RhYmluZGV4JywgLTEpLmZvY3VzKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICBfdGhpcy4kYW5jaG9yLmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYW4gZXZlbnQgaGFuZGxlciB0byB0aGUgYm9keSB0byBjbG9zZSBhbnkgZHJvcGRvd25zIG9uIGEgY2xpY2suXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2FkZEJvZHlIYW5kbGVyKCkge1xuICAgICB2YXIgJGJvZHkgPSAkKGRvY3VtZW50LmJvZHkpLm5vdCh0aGlzLiRlbGVtZW50KSxcbiAgICAgICAgIF90aGlzID0gdGhpcztcbiAgICAgJGJvZHkub2ZmKCdjbGljay56Zi5kcm9wZG93bicpXG4gICAgICAgICAgLm9uKCdjbGljay56Zi5kcm9wZG93bicsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgICAgaWYoX3RoaXMuJGFuY2hvci5pcyhlLnRhcmdldCkgfHwgX3RoaXMuJGFuY2hvci5maW5kKGUudGFyZ2V0KS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoX3RoaXMuJGVsZW1lbnQuZmluZChlLnRhcmdldCkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICAkYm9keS5vZmYoJ2NsaWNrLnpmLmRyb3Bkb3duJyk7XG4gICAgICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgdGhlIGRyb3Bkb3duIHBhbmUsIGFuZCBmaXJlcyBhIGJ1YmJsaW5nIGV2ZW50IHRvIGNsb3NlIG90aGVyIGRyb3Bkb3ducy5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBmaXJlcyBEcm9wZG93biNjbG9zZW1lXG4gICAqIEBmaXJlcyBEcm9wZG93biNzaG93XG4gICAqL1xuICBvcGVuKCkge1xuICAgIC8vIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgLyoqXG4gICAgICogRmlyZXMgdG8gY2xvc2Ugb3RoZXIgb3BlbiBkcm9wZG93bnNcbiAgICAgKiBAZXZlbnQgRHJvcGRvd24jY2xvc2VtZVxuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignY2xvc2VtZS56Zi5kcm9wZG93bicsIHRoaXMuJGVsZW1lbnQuYXR0cignaWQnKSk7XG4gICAgdGhpcy4kYW5jaG9yLmFkZENsYXNzKCdob3ZlcicpXG4gICAgICAgIC5hdHRyKHsnYXJpYS1leHBhbmRlZCc6IHRydWV9KTtcbiAgICAvLyB0aGlzLiRlbGVtZW50Lyouc2hvdygpKi87XG4gICAgdGhpcy5fc2V0UG9zaXRpb24oKTtcbiAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCdpcy1vcGVuJylcbiAgICAgICAgLmF0dHIoeydhcmlhLWhpZGRlbic6IGZhbHNlfSk7XG5cbiAgICBpZih0aGlzLm9wdGlvbnMuYXV0b0ZvY3VzKXtcbiAgICAgIHZhciAkZm9jdXNhYmxlID0gRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlKHRoaXMuJGVsZW1lbnQpO1xuICAgICAgaWYoJGZvY3VzYWJsZS5sZW5ndGgpe1xuICAgICAgICAkZm9jdXNhYmxlLmVxKDApLmZvY3VzKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayl7IHRoaXMuX2FkZEJvZHlIYW5kbGVyKCk7IH1cblxuICAgIC8qKlxuICAgICAqIEZpcmVzIG9uY2UgdGhlIGRyb3Bkb3duIGlzIHZpc2libGUuXG4gICAgICogQGV2ZW50IERyb3Bkb3duI3Nob3dcbiAgICAgKi9cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3Nob3cuemYuZHJvcGRvd24nLCBbdGhpcy4kZWxlbWVudF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgb3BlbiBkcm9wZG93biBwYW5lLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIERyb3Bkb3duI2hpZGVcbiAgICovXG4gIGNsb3NlKCkge1xuICAgIGlmKCF0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykpe1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKCdpcy1vcGVuJylcbiAgICAgICAgLmF0dHIoeydhcmlhLWhpZGRlbic6IHRydWV9KTtcblxuICAgIHRoaXMuJGFuY2hvci5yZW1vdmVDbGFzcygnaG92ZXInKVxuICAgICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIGZhbHNlKTtcblxuICAgIGlmKHRoaXMuY2xhc3NDaGFuZ2VkKXtcbiAgICAgIHZhciBjdXJQb3NpdGlvbkNsYXNzID0gdGhpcy5nZXRQb3NpdGlvbkNsYXNzKCk7XG4gICAgICBpZihjdXJQb3NpdGlvbkNsYXNzKXtcbiAgICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhjdXJQb3NpdGlvbkNsYXNzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3ModGhpcy5vcHRpb25zLnBvc2l0aW9uQ2xhc3MpXG4gICAgICAgICAgLyouaGlkZSgpKi8uY3NzKHtoZWlnaHQ6ICcnLCB3aWR0aDogJyd9KTtcbiAgICAgIHRoaXMuY2xhc3NDaGFuZ2VkID0gZmFsc2U7XG4gICAgICB0aGlzLmNvdW50ZXIgPSA0O1xuICAgICAgdGhpcy51c2VkUG9zaXRpb25zLmxlbmd0aCA9IDA7XG4gICAgfVxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignaGlkZS56Zi5kcm9wZG93bicsIFt0aGlzLiRlbGVtZW50XSk7XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlcyB0aGUgZHJvcGRvd24gcGFuZSdzIHZpc2liaWxpdHkuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgdG9nZ2xlKCkge1xuICAgIGlmKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSl7XG4gICAgICBpZih0aGlzLiRhbmNob3IuZGF0YSgnaG92ZXInKSkgcmV0dXJuO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBkcm9wZG93bi5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYudHJpZ2dlcicpLmhpZGUoKTtcbiAgICB0aGlzLiRhbmNob3Iub2ZmKCcuemYuZHJvcGRvd24nKTtcblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG5Ecm9wZG93bi5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIEFtb3VudCBvZiB0aW1lIHRvIGRlbGF5IG9wZW5pbmcgYSBzdWJtZW51IG9uIGhvdmVyIGV2ZW50LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDI1MFxuICAgKi9cbiAgaG92ZXJEZWxheTogMjUwLFxuICAvKipcbiAgICogQWxsb3cgc3VibWVudXMgdG8gb3BlbiBvbiBob3ZlciBldmVudHNcbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgaG92ZXI6IGZhbHNlLFxuICAvKipcbiAgICogRG9uJ3QgY2xvc2UgZHJvcGRvd24gd2hlbiBob3ZlcmluZyBvdmVyIGRyb3Bkb3duIHBhbmVcbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBob3ZlclBhbmU6IGZhbHNlLFxuICAvKipcbiAgICogTnVtYmVyIG9mIHBpeGVscyBiZXR3ZWVuIHRoZSBkcm9wZG93biBwYW5lIGFuZCB0aGUgdHJpZ2dlcmluZyBlbGVtZW50IG9uIG9wZW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMVxuICAgKi9cbiAgdk9mZnNldDogMSxcbiAgLyoqXG4gICAqIE51bWJlciBvZiBwaXhlbHMgYmV0d2VlbiB0aGUgZHJvcGRvd24gcGFuZSBhbmQgdGhlIHRyaWdnZXJpbmcgZWxlbWVudCBvbiBvcGVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDFcbiAgICovXG4gIGhPZmZzZXQ6IDEsXG4gIC8qKlxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIGFkanVzdCBvcGVuIHBvc2l0aW9uLiBKUyB3aWxsIHRlc3QgYW5kIGZpbGwgdGhpcyBpbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAndG9wJ1xuICAgKi9cbiAgcG9zaXRpb25DbGFzczogJycsXG4gIC8qKlxuICAgKiBBbGxvdyB0aGUgcGx1Z2luIHRvIHRyYXAgZm9jdXMgdG8gdGhlIGRyb3Bkb3duIHBhbmUgaWYgb3BlbmVkIHdpdGgga2V5Ym9hcmQgY29tbWFuZHMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIHRyYXBGb2N1czogZmFsc2UsXG4gIC8qKlxuICAgKiBBbGxvdyB0aGUgcGx1Z2luIHRvIHNldCBmb2N1cyB0byB0aGUgZmlyc3QgZm9jdXNhYmxlIGVsZW1lbnQgd2l0aGluIHRoZSBwYW5lLCByZWdhcmRsZXNzIG9mIG1ldGhvZCBvZiBvcGVuaW5nLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGF1dG9Gb2N1czogZmFsc2UsXG4gIC8qKlxuICAgKiBBbGxvd3MgYSBjbGljayBvbiB0aGUgYm9keSB0byBjbG9zZSB0aGUgZHJvcGRvd24uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGNsb3NlT25DbGljazogZmFsc2Vcbn1cblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKERyb3Bkb3duLCAnRHJvcGRvd24nKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIERyb3Bkb3duTWVudSBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uZHJvcGRvd24tbWVudVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5ib3hcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubmVzdFxuICovXG5cbmNsYXNzIERyb3Bkb3duTWVudSB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIERyb3Bkb3duTWVudS5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBEcm9wZG93bk1lbnUjaW5pdFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGEgZHJvcGRvd24gbWVudS5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBEcm9wZG93bk1lbnUuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIEZvdW5kYXRpb24uTmVzdC5GZWF0aGVyKHRoaXMuJGVsZW1lbnQsICdkcm9wZG93bicpO1xuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0Ryb3Bkb3duTWVudScpO1xuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ0Ryb3Bkb3duTWVudScsIHtcbiAgICAgICdFTlRFUic6ICdvcGVuJyxcbiAgICAgICdTUEFDRSc6ICdvcGVuJyxcbiAgICAgICdBUlJPV19SSUdIVCc6ICduZXh0JyxcbiAgICAgICdBUlJPV19VUCc6ICd1cCcsXG4gICAgICAnQVJST1dfRE9XTic6ICdkb3duJyxcbiAgICAgICdBUlJPV19MRUZUJzogJ3ByZXZpb3VzJyxcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHBsdWdpbiwgYW5kIGNhbGxzIF9wcmVwYXJlTWVudVxuICAgKiBAcHJpdmF0ZVxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBzdWJzID0gdGhpcy4kZWxlbWVudC5maW5kKCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpO1xuICAgIHRoaXMuJGVsZW1lbnQuY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpLmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudScpLmFkZENsYXNzKCdmaXJzdC1zdWInKTtcblxuICAgIHRoaXMuJG1lbnVJdGVtcyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW3JvbGU9XCJtZW51aXRlbVwiXScpO1xuICAgIHRoaXMuJHRhYnMgPSB0aGlzLiRlbGVtZW50LmNoaWxkcmVuKCdbcm9sZT1cIm1lbnVpdGVtXCJdJyk7XG4gICAgdGhpcy4kdGFicy5maW5kKCd1bC5pcy1kcm9wZG93bi1zdWJtZW51JykuYWRkQ2xhc3ModGhpcy5vcHRpb25zLnZlcnRpY2FsQ2xhc3MpO1xuXG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3ModGhpcy5vcHRpb25zLnJpZ2h0Q2xhc3MpIHx8IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPT09ICdyaWdodCcgfHwgRm91bmRhdGlvbi5ydGwoKSB8fCB0aGlzLiRlbGVtZW50LnBhcmVudHMoJy50b3AtYmFyLXJpZ2h0JykuaXMoJyonKSkge1xuICAgICAgdGhpcy5vcHRpb25zLmFsaWdubWVudCA9ICdyaWdodCc7XG4gICAgICBzdWJzLmFkZENsYXNzKCdvcGVucy1sZWZ0Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN1YnMuYWRkQ2xhc3MoJ29wZW5zLXJpZ2h0Jyk7XG4gICAgfVxuICAgIHRoaXMuY2hhbmdlZCA9IGZhbHNlO1xuICAgIHRoaXMuX2V2ZW50cygpO1xuICB9O1xuICAvKipcbiAgICogQWRkcyBldmVudCBsaXN0ZW5lcnMgdG8gZWxlbWVudHMgd2l0aGluIHRoZSBtZW51XG4gICAqIEBwcml2YXRlXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICBoYXNUb3VjaCA9ICdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdyB8fCAodHlwZW9mIHdpbmRvdy5vbnRvdWNoc3RhcnQgIT09ICd1bmRlZmluZWQnKSxcbiAgICAgICAgcGFyQ2xhc3MgPSAnaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbGlja09wZW4gfHwgaGFzVG91Y2gpIHtcbiAgICAgIHRoaXMuJG1lbnVJdGVtcy5vbignY2xpY2suemYuZHJvcGRvd25tZW51IHRvdWNoc3RhcnQuemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgJGVsZW0gPSAkKGUudGFyZ2V0KS5wYXJlbnRzVW50aWwoJ3VsJywgYC4ke3BhckNsYXNzfWApLFxuICAgICAgICAgICAgaGFzU3ViID0gJGVsZW0uaGFzQ2xhc3MocGFyQ2xhc3MpLFxuICAgICAgICAgICAgaGFzQ2xpY2tlZCA9ICRlbGVtLmF0dHIoJ2RhdGEtaXMtY2xpY2snKSA9PT0gJ3RydWUnLFxuICAgICAgICAgICAgJHN1YiA9ICRlbGVtLmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudScpO1xuXG4gICAgICAgIGlmIChoYXNTdWIpIHtcbiAgICAgICAgICBpZiAoaGFzQ2xpY2tlZCkge1xuICAgICAgICAgICAgaWYgKCFfdGhpcy5vcHRpb25zLmNsb3NlT25DbGljayB8fCAoIV90aGlzLm9wdGlvbnMuY2xpY2tPcGVuICYmICFoYXNUb3VjaCkgfHwgKF90aGlzLm9wdGlvbnMuZm9yY2VGb2xsb3cgJiYgaGFzVG91Y2gpKSB7IHJldHVybjsgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgX3RoaXMuX3Nob3coJGVsZW0uY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51JykpO1xuICAgICAgICAgICAgJGVsZW0uYWRkKCRlbGVtLnBhcmVudHNVbnRpbChfdGhpcy4kZWxlbWVudCwgYC4ke3BhckNsYXNzfWApKS5hdHRyKCdkYXRhLWlzLWNsaWNrJywgdHJ1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgeyByZXR1cm47IH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5vcHRpb25zLmRpc2FibGVIb3Zlcikge1xuICAgICAgdGhpcy4kbWVudUl0ZW1zLm9uKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdmFyICRlbGVtID0gJCh0aGlzKSxcbiAgICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKTtcblxuICAgICAgICBpZiAoaGFzU3ViKSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLmRlbGF5KTtcbiAgICAgICAgICBfdGhpcy5kZWxheSA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBfdGhpcy5fc2hvdygkZWxlbS5jaGlsZHJlbignLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKSk7XG4gICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5ob3ZlckRlbGF5KTtcbiAgICAgICAgfVxuICAgICAgfSkub24oJ21vdXNlbGVhdmUuemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgJGVsZW0gPSAkKHRoaXMpLFxuICAgICAgICAgICAgaGFzU3ViID0gJGVsZW0uaGFzQ2xhc3MocGFyQ2xhc3MpO1xuICAgICAgICBpZiAoaGFzU3ViICYmIF90aGlzLm9wdGlvbnMuYXV0b2Nsb3NlKSB7XG4gICAgICAgICAgaWYgKCRlbGVtLmF0dHIoJ2RhdGEtaXMtY2xpY2snKSA9PT0gJ3RydWUnICYmIF90aGlzLm9wdGlvbnMuY2xpY2tPcGVuKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLmRlbGF5KTtcbiAgICAgICAgICBfdGhpcy5kZWxheSA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBfdGhpcy5faGlkZSgkZWxlbSk7XG4gICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5jbG9zaW5nVGltZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLiRtZW51SXRlbXMub24oJ2tleWRvd24uemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSkge1xuICAgICAgdmFyICRlbGVtZW50ID0gJChlLnRhcmdldCkucGFyZW50c1VudGlsKCd1bCcsICdbcm9sZT1cIm1lbnVpdGVtXCJdJyksXG4gICAgICAgICAgaXNUYWIgPSBfdGhpcy4kdGFicy5pbmRleCgkZWxlbWVudCkgPiAtMSxcbiAgICAgICAgICAkZWxlbWVudHMgPSBpc1RhYiA/IF90aGlzLiR0YWJzIDogJGVsZW1lbnQuc2libGluZ3MoJ2xpJykuYWRkKCRlbGVtZW50KSxcbiAgICAgICAgICAkcHJldkVsZW1lbnQsXG4gICAgICAgICAgJG5leHRFbGVtZW50O1xuXG4gICAgICAkZWxlbWVudHMuZWFjaChmdW5jdGlvbihpKSB7XG4gICAgICAgIGlmICgkKHRoaXMpLmlzKCRlbGVtZW50KSkge1xuICAgICAgICAgICRwcmV2RWxlbWVudCA9ICRlbGVtZW50cy5lcShpLTEpO1xuICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50cy5lcShpKzEpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHZhciBuZXh0U2libGluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoISRlbGVtZW50LmlzKCc6bGFzdC1jaGlsZCcpKSAkbmV4dEVsZW1lbnQuY2hpbGRyZW4oJ2E6Zmlyc3QnKS5mb2N1cygpO1xuICAgICAgfSwgcHJldlNpYmxpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHByZXZFbGVtZW50LmNoaWxkcmVuKCdhOmZpcnN0JykuZm9jdXMoKTtcbiAgICAgIH0sIG9wZW5TdWIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzdWIgPSAkZWxlbWVudC5jaGlsZHJlbigndWwuaXMtZHJvcGRvd24tc3VibWVudScpO1xuICAgICAgICBpZiAoJHN1Yi5sZW5ndGgpIHtcbiAgICAgICAgICBfdGhpcy5fc2hvdygkc3ViKTtcbiAgICAgICAgICAkZWxlbWVudC5maW5kKCdsaSA+IGE6Zmlyc3QnKS5mb2N1cygpO1xuICAgICAgICB9IGVsc2UgeyByZXR1cm47IH1cbiAgICAgIH0sIGNsb3NlU3ViID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vaWYgKCRlbGVtZW50LmlzKCc6Zmlyc3QtY2hpbGQnKSkge1xuICAgICAgICB2YXIgY2xvc2UgPSAkZWxlbWVudC5wYXJlbnQoJ3VsJykucGFyZW50KCdsaScpO1xuICAgICAgICAgIGNsb3NlLmNoaWxkcmVuKCdhOmZpcnN0JykuZm9jdXMoKTtcbiAgICAgICAgICBfdGhpcy5faGlkZShjbG9zZSk7XG4gICAgICAgIC8vfVxuICAgICAgfTtcbiAgICAgIHZhciBmdW5jdGlvbnMgPSB7XG4gICAgICAgIG9wZW46IG9wZW5TdWIsXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy5faGlkZShfdGhpcy4kZWxlbWVudCk7XG4gICAgICAgICAgX3RoaXMuJG1lbnVJdGVtcy5maW5kKCdhOmZpcnN0JykuZm9jdXMoKTsgLy8gZm9jdXMgdG8gZmlyc3QgZWxlbWVudFxuICAgICAgICB9LFxuICAgICAgICBoYW5kbGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgaWYgKGlzVGFiKSB7XG4gICAgICAgIGlmIChfdGhpcy52ZXJ0aWNhbCkgeyAvLyB2ZXJ0aWNhbCBtZW51XG4gICAgICAgICAgaWYgKF90aGlzLm9wdGlvbnMuYWxpZ25tZW50ID09PSAnbGVmdCcpIHsgLy8gbGVmdCBhbGlnbmVkXG4gICAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgICAgZG93bjogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgICAgIHVwOiBwcmV2U2libGluZyxcbiAgICAgICAgICAgICAgbmV4dDogb3BlblN1YixcbiAgICAgICAgICAgICAgcHJldmlvdXM6IGNsb3NlU3ViXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2UgeyAvLyByaWdodCBhbGlnbmVkXG4gICAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgICAgZG93bjogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgICAgIHVwOiBwcmV2U2libGluZyxcbiAgICAgICAgICAgICAgbmV4dDogY2xvc2VTdWIsXG4gICAgICAgICAgICAgIHByZXZpb3VzOiBvcGVuU3ViXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7IC8vIGhvcml6b250YWwgbWVudVxuICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgbmV4dDogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgICBwcmV2aW91czogcHJldlNpYmxpbmcsXG4gICAgICAgICAgICBkb3duOiBvcGVuU3ViLFxuICAgICAgICAgICAgdXA6IGNsb3NlU3ViXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7IC8vIG5vdCB0YWJzIC0+IG9uZSBzdWJcbiAgICAgICAgaWYgKF90aGlzLm9wdGlvbnMuYWxpZ25tZW50ID09PSAnbGVmdCcpIHsgLy8gbGVmdCBhbGlnbmVkXG4gICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XG4gICAgICAgICAgICBuZXh0OiBvcGVuU3ViLFxuICAgICAgICAgICAgcHJldmlvdXM6IGNsb3NlU3ViLFxuICAgICAgICAgICAgZG93bjogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgICB1cDogcHJldlNpYmxpbmdcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHsgLy8gcmlnaHQgYWxpZ25lZFxuICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgbmV4dDogY2xvc2VTdWIsXG4gICAgICAgICAgICBwcmV2aW91czogb3BlblN1YixcbiAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdEcm9wZG93bk1lbnUnLCBmdW5jdGlvbnMpO1xuXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhbiBldmVudCBoYW5kbGVyIHRvIHRoZSBib2R5IHRvIGNsb3NlIGFueSBkcm9wZG93bnMgb24gYSBjbGljay5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfYWRkQm9keUhhbmRsZXIoKSB7XG4gICAgdmFyICRib2R5ID0gJChkb2N1bWVudC5ib2R5KSxcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xuICAgICRib2R5Lm9mZignbW91c2V1cC56Zi5kcm9wZG93bm1lbnUgdG91Y2hlbmQuemYuZHJvcGRvd25tZW51JylcbiAgICAgICAgIC5vbignbW91c2V1cC56Zi5kcm9wZG93bm1lbnUgdG91Y2hlbmQuemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICB2YXIgJGxpbmsgPSBfdGhpcy4kZWxlbWVudC5maW5kKGUudGFyZ2V0KTtcbiAgICAgICAgICAgaWYgKCRsaW5rLmxlbmd0aCkgeyByZXR1cm47IH1cblxuICAgICAgICAgICBfdGhpcy5faGlkZSgpO1xuICAgICAgICAgICAkYm9keS5vZmYoJ21vdXNldXAuemYuZHJvcGRvd25tZW51IHRvdWNoZW5kLnpmLmRyb3Bkb3dubWVudScpO1xuICAgICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgYSBkcm9wZG93biBwYW5lLCBhbmQgY2hlY2tzIGZvciBjb2xsaXNpb25zIGZpcnN0LlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHN1YiAtIHVsIGVsZW1lbnQgdGhhdCBpcyBhIHN1Ym1lbnUgdG8gc2hvd1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQGZpcmVzIERyb3Bkb3duTWVudSNzaG93XG4gICAqL1xuICBfc2hvdygkc3ViKSB7XG4gICAgdmFyIGlkeCA9IHRoaXMuJHRhYnMuaW5kZXgodGhpcy4kdGFicy5maWx0ZXIoZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgIHJldHVybiAkKGVsKS5maW5kKCRzdWIpLmxlbmd0aCA+IDA7XG4gICAgfSkpO1xuICAgIHZhciAkc2licyA9ICRzdWIucGFyZW50KCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpLnNpYmxpbmdzKCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpO1xuICAgIHRoaXMuX2hpZGUoJHNpYnMsIGlkeCk7XG4gICAgJHN1Yi5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJykuYWRkQ2xhc3MoJ2pzLWRyb3Bkb3duLWFjdGl2ZScpLmF0dHIoeydhcmlhLWhpZGRlbic6IGZhbHNlfSlcbiAgICAgICAgLnBhcmVudCgnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKS5hZGRDbGFzcygnaXMtYWN0aXZlJylcbiAgICAgICAgLmF0dHIoeydhcmlhLWV4cGFuZGVkJzogdHJ1ZX0pO1xuICAgIHZhciBjbGVhciA9IEZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UoJHN1YiwgbnVsbCwgdHJ1ZSk7XG4gICAgaWYgKCFjbGVhcikge1xuICAgICAgdmFyIG9sZENsYXNzID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ2xlZnQnID8gJy1yaWdodCcgOiAnLWxlZnQnLFxuICAgICAgICAgICRwYXJlbnRMaSA9ICRzdWIucGFyZW50KCcuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKTtcbiAgICAgICRwYXJlbnRMaS5yZW1vdmVDbGFzcyhgb3BlbnMke29sZENsYXNzfWApLmFkZENsYXNzKGBvcGVucy0ke3RoaXMub3B0aW9ucy5hbGlnbm1lbnR9YCk7XG4gICAgICBjbGVhciA9IEZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UoJHN1YiwgbnVsbCwgdHJ1ZSk7XG4gICAgICBpZiAoIWNsZWFyKSB7XG4gICAgICAgICRwYXJlbnRMaS5yZW1vdmVDbGFzcyhgb3BlbnMtJHt0aGlzLm9wdGlvbnMuYWxpZ25tZW50fWApLmFkZENsYXNzKCdvcGVucy1pbm5lcicpO1xuICAgICAgfVxuICAgICAgdGhpcy5jaGFuZ2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgJHN1Yi5jc3MoJ3Zpc2liaWxpdHknLCAnJyk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spIHsgdGhpcy5fYWRkQm9keUhhbmRsZXIoKTsgfVxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIG5ldyBkcm9wZG93biBwYW5lIGlzIHZpc2libGUuXG4gICAgICogQGV2ZW50IERyb3Bkb3duTWVudSNzaG93XG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdzaG93LnpmLmRyb3Bkb3dubWVudScsIFskc3ViXSk7XG4gIH1cblxuICAvKipcbiAgICogSGlkZXMgYSBzaW5nbGUsIGN1cnJlbnRseSBvcGVuIGRyb3Bkb3duIHBhbmUsIGlmIHBhc3NlZCBhIHBhcmFtZXRlciwgb3RoZXJ3aXNlLCBoaWRlcyBldmVyeXRoaW5nLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtIC0gZWxlbWVudCB3aXRoIGEgc3VibWVudSB0byBoaWRlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpZHggLSBpbmRleCBvZiB0aGUgJHRhYnMgY29sbGVjdGlvbiB0byBoaWRlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaGlkZSgkZWxlbSwgaWR4KSB7XG4gICAgdmFyICR0b0Nsb3NlO1xuICAgIGlmICgkZWxlbSAmJiAkZWxlbS5sZW5ndGgpIHtcbiAgICAgICR0b0Nsb3NlID0gJGVsZW07XG4gICAgfSBlbHNlIGlmIChpZHggIT09IHVuZGVmaW5lZCkge1xuICAgICAgJHRvQ2xvc2UgPSB0aGlzLiR0YWJzLm5vdChmdW5jdGlvbihpLCBlbCkge1xuICAgICAgICByZXR1cm4gaSA9PT0gaWR4O1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJHRvQ2xvc2UgPSB0aGlzLiRlbGVtZW50O1xuICAgIH1cbiAgICB2YXIgc29tZXRoaW5nVG9DbG9zZSA9ICR0b0Nsb3NlLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSB8fCAkdG9DbG9zZS5maW5kKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMDtcblxuICAgIGlmIChzb21ldGhpbmdUb0Nsb3NlKSB7XG4gICAgICAkdG9DbG9zZS5maW5kKCdsaS5pcy1hY3RpdmUnKS5hZGQoJHRvQ2xvc2UpLmF0dHIoe1xuICAgICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlLFxuICAgICAgICAnZGF0YS1pcy1jbGljayc6IGZhbHNlXG4gICAgICB9KS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG5cbiAgICAgICR0b0Nsb3NlLmZpbmQoJ3VsLmpzLWRyb3Bkb3duLWFjdGl2ZScpLmF0dHIoe1xuICAgICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlXG4gICAgICB9KS5yZW1vdmVDbGFzcygnanMtZHJvcGRvd24tYWN0aXZlJyk7XG5cbiAgICAgIGlmICh0aGlzLmNoYW5nZWQgfHwgJHRvQ2xvc2UuZmluZCgnb3BlbnMtaW5uZXInKS5sZW5ndGgpIHtcbiAgICAgICAgdmFyIG9sZENsYXNzID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ2xlZnQnID8gJ3JpZ2h0JyA6ICdsZWZ0JztcbiAgICAgICAgJHRvQ2xvc2UuZmluZCgnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKS5hZGQoJHRvQ2xvc2UpXG4gICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKGBvcGVucy1pbm5lciBvcGVucy0ke3RoaXMub3B0aW9ucy5hbGlnbm1lbnR9YClcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoYG9wZW5zLSR7b2xkQ2xhc3N9YCk7XG4gICAgICAgIHRoaXMuY2hhbmdlZCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyB3aGVuIHRoZSBvcGVuIG1lbnVzIGFyZSBjbG9zZWQuXG4gICAgICAgKiBAZXZlbnQgRHJvcGRvd25NZW51I2hpZGVcbiAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdoaWRlLnpmLmRyb3Bkb3dubWVudScsIFskdG9DbG9zZV0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgcGx1Z2luLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kbWVudUl0ZW1zLm9mZignLnpmLmRyb3Bkb3dubWVudScpLnJlbW92ZUF0dHIoJ2RhdGEtaXMtY2xpY2snKVxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2lzLXJpZ2h0LWFycm93IGlzLWxlZnQtYXJyb3cgaXMtZG93bi1hcnJvdyBvcGVucy1yaWdodCBvcGVucy1sZWZ0IG9wZW5zLWlubmVyJyk7XG4gICAgJChkb2N1bWVudC5ib2R5KS5vZmYoJy56Zi5kcm9wZG93bm1lbnUnKTtcbiAgICBGb3VuZGF0aW9uLk5lc3QuQnVybih0aGlzLiRlbGVtZW50LCAnZHJvcGRvd24nKTtcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZWZhdWx0IHNldHRpbmdzIGZvciBwbHVnaW5cbiAqL1xuRHJvcGRvd25NZW51LmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogRGlzYWxsb3dzIGhvdmVyIGV2ZW50cyBmcm9tIG9wZW5pbmcgc3VibWVudXNcbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgZGlzYWJsZUhvdmVyOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93IGEgc3VibWVudSB0byBhdXRvbWF0aWNhbGx5IGNsb3NlIG9uIGEgbW91c2VsZWF2ZSBldmVudCwgaWYgbm90IGNsaWNrZWQgb3Blbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBhdXRvY2xvc2U6IHRydWUsXG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSB0byBkZWxheSBvcGVuaW5nIGEgc3VibWVudSBvbiBob3ZlciBldmVudC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSA1MFxuICAgKi9cbiAgaG92ZXJEZWxheTogNTAsXG4gIC8qKlxuICAgKiBBbGxvdyBhIHN1Ym1lbnUgdG8gb3Blbi9yZW1haW4gb3BlbiBvbiBwYXJlbnQgY2xpY2sgZXZlbnQuIEFsbG93cyBjdXJzb3IgdG8gbW92ZSBhd2F5IGZyb20gbWVudS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjbGlja09wZW46IGZhbHNlLFxuICAvKipcbiAgICogQW1vdW50IG9mIHRpbWUgdG8gZGVsYXkgY2xvc2luZyBhIHN1Ym1lbnUgb24gYSBtb3VzZWxlYXZlIGV2ZW50LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDUwMFxuICAgKi9cblxuICBjbG9zaW5nVGltZTogNTAwLFxuICAvKipcbiAgICogUG9zaXRpb24gb2YgdGhlIG1lbnUgcmVsYXRpdmUgdG8gd2hhdCBkaXJlY3Rpb24gdGhlIHN1Ym1lbnVzIHNob3VsZCBvcGVuLiBIYW5kbGVkIGJ5IEpTLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdsZWZ0J1xuICAgKi9cbiAgYWxpZ25tZW50OiAnbGVmdCcsXG4gIC8qKlxuICAgKiBBbGxvdyBjbGlja3Mgb24gdGhlIGJvZHkgdG8gY2xvc2UgYW55IG9wZW4gc3VibWVudXMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuICAvKipcbiAgICogQ2xhc3MgYXBwbGllZCB0byB2ZXJ0aWNhbCBvcmllbnRlZCBtZW51cywgRm91bmRhdGlvbiBkZWZhdWx0IGlzIGB2ZXJ0aWNhbGAuIFVwZGF0ZSB0aGlzIGlmIHVzaW5nIHlvdXIgb3duIGNsYXNzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICd2ZXJ0aWNhbCdcbiAgICovXG4gIHZlcnRpY2FsQ2xhc3M6ICd2ZXJ0aWNhbCcsXG4gIC8qKlxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHJpZ2h0LXNpZGUgb3JpZW50ZWQgbWVudXMsIEZvdW5kYXRpb24gZGVmYXVsdCBpcyBgYWxpZ24tcmlnaHRgLiBVcGRhdGUgdGhpcyBpZiB1c2luZyB5b3VyIG93biBjbGFzcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnYWxpZ24tcmlnaHQnXG4gICAqL1xuICByaWdodENsYXNzOiAnYWxpZ24tcmlnaHQnLFxuICAvKipcbiAgICogQm9vbGVhbiB0byBmb3JjZSBvdmVyaWRlIHRoZSBjbGlja2luZyBvZiBsaW5rcyB0byBwZXJmb3JtIGRlZmF1bHQgYWN0aW9uLCBvbiBzZWNvbmQgdG91Y2ggZXZlbnQgZm9yIG1vYmlsZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgZm9yY2VGb2xsb3c6IHRydWVcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihEcm9wZG93bk1lbnUsICdEcm9wZG93bk1lbnUnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIEVxdWFsaXplciBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uZXF1YWxpemVyXG4gKi9cblxuY2xhc3MgRXF1YWxpemVyIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgRXF1YWxpemVyLlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIEVxdWFsaXplciNpbml0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIHRyaWdnZXIgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpe1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyAgPSAkLmV4dGVuZCh7fSwgRXF1YWxpemVyLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdFcXVhbGl6ZXInKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgRXF1YWxpemVyIHBsdWdpbiBhbmQgY2FsbHMgZnVuY3Rpb25zIHRvIGdldCBlcXVhbGl6ZXIgZnVuY3Rpb25pbmcgb24gbG9hZC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBlcUlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdkYXRhLWVxdWFsaXplcicpIHx8ICcnO1xuICAgIHZhciAkd2F0Y2hlZCA9IHRoaXMuJGVsZW1lbnQuZmluZChgW2RhdGEtZXF1YWxpemVyLXdhdGNoPVwiJHtlcUlkfVwiXWApO1xuXG4gICAgdGhpcy4kd2F0Y2hlZCA9ICR3YXRjaGVkLmxlbmd0aCA/ICR3YXRjaGVkIDogdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1lcXVhbGl6ZXItd2F0Y2hdJyk7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdkYXRhLXJlc2l6ZScsIChlcUlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2VxJykpKTtcblxuICAgIHRoaXMuaGFzTmVzdGVkID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1lcXVhbGl6ZXJdJykubGVuZ3RoID4gMDtcbiAgICB0aGlzLmlzTmVzdGVkID0gdGhpcy4kZWxlbWVudC5wYXJlbnRzVW50aWwoZG9jdW1lbnQuYm9keSwgJ1tkYXRhLWVxdWFsaXplcl0nKS5sZW5ndGggPiAwO1xuICAgIHRoaXMuaXNPbiA9IGZhbHNlO1xuXG4gICAgdmFyIGltZ3MgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2ltZycpO1xuICAgIHZhciB0b29TbWFsbDtcbiAgICBpZih0aGlzLm9wdGlvbnMuZXF1YWxpemVPbil7XG4gICAgICB0b29TbWFsbCA9IHRoaXMuX2NoZWNrTVEoKTtcbiAgICAgICQod2luZG93KS5vbignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgdGhpcy5fY2hlY2tNUS5iaW5kKHRoaXMpKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuX2V2ZW50cygpO1xuICAgIH1cbiAgICBpZigodG9vU21hbGwgIT09IHVuZGVmaW5lZCAmJiB0b29TbWFsbCA9PT0gZmFsc2UpIHx8IHRvb1NtYWxsID09PSB1bmRlZmluZWQpe1xuICAgICAgaWYoaW1ncy5sZW5ndGgpe1xuICAgICAgICBGb3VuZGF0aW9uLm9uSW1hZ2VzTG9hZGVkKGltZ3MsIHRoaXMuX3JlZmxvdy5iaW5kKHRoaXMpKTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLl9yZWZsb3coKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBldmVudCBsaXN0ZW5lcnMgaWYgdGhlIGJyZWFrcG9pbnQgaXMgdG9vIHNtYWxsLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3BhdXNlRXZlbnRzKCkge1xuICAgIHRoaXMuaXNPbiA9IGZhbHNlO1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYuZXF1YWxpemVyIHJlc2l6ZW1lLnpmLnRyaWdnZXInKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBldmVudHMgZm9yIEVxdWFsaXplci5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB0aGlzLl9wYXVzZUV2ZW50cygpO1xuICAgIGlmKHRoaXMuaGFzTmVzdGVkKXtcbiAgICAgIHRoaXMuJGVsZW1lbnQub24oJ3Bvc3RlcXVhbGl6ZWQuemYuZXF1YWxpemVyJywgZnVuY3Rpb24oZSl7XG4gICAgICAgIGlmKGUudGFyZ2V0ICE9PSBfdGhpcy4kZWxlbWVudFswXSl7IF90aGlzLl9yZWZsb3coKTsgfVxuICAgICAgfSk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCdyZXNpemVtZS56Zi50cmlnZ2VyJywgdGhpcy5fcmVmbG93LmJpbmQodGhpcykpO1xuICAgIH1cbiAgICB0aGlzLmlzT24gPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB0aGUgY3VycmVudCBicmVha3BvaW50IHRvIHRoZSBtaW5pbXVtIHJlcXVpcmVkIHNpemUuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfY2hlY2tNUSgpIHtcbiAgICB2YXIgdG9vU21hbGwgPSAhRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QodGhpcy5vcHRpb25zLmVxdWFsaXplT24pO1xuICAgIGlmKHRvb1NtYWxsKXtcbiAgICAgIGlmKHRoaXMuaXNPbil7XG4gICAgICAgIHRoaXMuX3BhdXNlRXZlbnRzKCk7XG4gICAgICAgIHRoaXMuJHdhdGNoZWQuY3NzKCdoZWlnaHQnLCAnYXV0bycpO1xuICAgICAgfVxuICAgIH1lbHNle1xuICAgICAgaWYoIXRoaXMuaXNPbil7XG4gICAgICAgIHRoaXMuX2V2ZW50cygpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdG9vU21hbGw7XG4gIH1cblxuICAvKipcbiAgICogQSBub29wIHZlcnNpb24gZm9yIHRoZSBwbHVnaW5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9raWxsc3dpdGNoKCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyBuZWNlc3NhcnkgZnVuY3Rpb25zIHRvIHVwZGF0ZSBFcXVhbGl6ZXIgdXBvbiBET00gY2hhbmdlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfcmVmbG93KCkge1xuICAgIGlmKCF0aGlzLm9wdGlvbnMuZXF1YWxpemVPblN0YWNrKXtcbiAgICAgIGlmKHRoaXMuX2lzU3RhY2tlZCgpKXtcbiAgICAgICAgdGhpcy4kd2F0Y2hlZC5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5lcXVhbGl6ZUJ5Um93KSB7XG4gICAgICB0aGlzLmdldEhlaWdodHNCeVJvdyh0aGlzLmFwcGx5SGVpZ2h0QnlSb3cuYmluZCh0aGlzKSk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLmdldEhlaWdodHModGhpcy5hcHBseUhlaWdodC5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWFudWFsbHkgZGV0ZXJtaW5lcyBpZiB0aGUgZmlyc3QgMiBlbGVtZW50cyBhcmUgKk5PVCogc3RhY2tlZC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pc1N0YWNrZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHdhdGNoZWRbMF0ub2Zmc2V0VG9wICE9PSB0aGlzLiR3YXRjaGVkWzFdLm9mZnNldFRvcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kcyB0aGUgb3V0ZXIgaGVpZ2h0cyBvZiBjaGlsZHJlbiBjb250YWluZWQgd2l0aGluIGFuIEVxdWFsaXplciBwYXJlbnQgYW5kIHJldHVybnMgdGhlbSBpbiBhbiBhcnJheVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIEEgbm9uLW9wdGlvbmFsIGNhbGxiYWNrIHRvIHJldHVybiB0aGUgaGVpZ2h0cyBhcnJheSB0by5cbiAgICogQHJldHVybnMge0FycmF5fSBoZWlnaHRzIC0gQW4gYXJyYXkgb2YgaGVpZ2h0cyBvZiBjaGlsZHJlbiB3aXRoaW4gRXF1YWxpemVyIGNvbnRhaW5lclxuICAgKi9cbiAgZ2V0SGVpZ2h0cyhjYikge1xuICAgIHZhciBoZWlnaHRzID0gW107XG4gICAgZm9yKHZhciBpID0gMCwgbGVuID0gdGhpcy4kd2F0Y2hlZC5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICB0aGlzLiR3YXRjaGVkW2ldLnN0eWxlLmhlaWdodCA9ICdhdXRvJztcbiAgICAgIGhlaWdodHMucHVzaCh0aGlzLiR3YXRjaGVkW2ldLm9mZnNldEhlaWdodCk7XG4gICAgfVxuICAgIGNiKGhlaWdodHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmRzIHRoZSBvdXRlciBoZWlnaHRzIG9mIGNoaWxkcmVuIGNvbnRhaW5lZCB3aXRoaW4gYW4gRXF1YWxpemVyIHBhcmVudCBhbmQgcmV0dXJucyB0aGVtIGluIGFuIGFycmF5XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gQSBub24tb3B0aW9uYWwgY2FsbGJhY2sgdG8gcmV0dXJuIHRoZSBoZWlnaHRzIGFycmF5IHRvLlxuICAgKiBAcmV0dXJucyB7QXJyYXl9IGdyb3VwcyAtIEFuIGFycmF5IG9mIGhlaWdodHMgb2YgY2hpbGRyZW4gd2l0aGluIEVxdWFsaXplciBjb250YWluZXIgZ3JvdXBlZCBieSByb3cgd2l0aCBlbGVtZW50LGhlaWdodCBhbmQgbWF4IGFzIGxhc3QgY2hpbGRcbiAgICovXG4gIGdldEhlaWdodHNCeVJvdyhjYikge1xuICAgIHZhciBsYXN0RWxUb3BPZmZzZXQgPSAodGhpcy4kd2F0Y2hlZC5sZW5ndGggPyB0aGlzLiR3YXRjaGVkLmZpcnN0KCkub2Zmc2V0KCkudG9wIDogMCksXG4gICAgICAgIGdyb3VwcyA9IFtdLFxuICAgICAgICBncm91cCA9IDA7XG4gICAgLy9ncm91cCBieSBSb3dcbiAgICBncm91cHNbZ3JvdXBdID0gW107XG4gICAgZm9yKHZhciBpID0gMCwgbGVuID0gdGhpcy4kd2F0Y2hlZC5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICB0aGlzLiR3YXRjaGVkW2ldLnN0eWxlLmhlaWdodCA9ICdhdXRvJztcbiAgICAgIC8vbWF5YmUgY291bGQgdXNlIHRoaXMuJHdhdGNoZWRbaV0ub2Zmc2V0VG9wXG4gICAgICB2YXIgZWxPZmZzZXRUb3AgPSAkKHRoaXMuJHdhdGNoZWRbaV0pLm9mZnNldCgpLnRvcDtcbiAgICAgIGlmIChlbE9mZnNldFRvcCE9bGFzdEVsVG9wT2Zmc2V0KSB7XG4gICAgICAgIGdyb3VwKys7XG4gICAgICAgIGdyb3Vwc1tncm91cF0gPSBbXTtcbiAgICAgICAgbGFzdEVsVG9wT2Zmc2V0PWVsT2Zmc2V0VG9wO1xuICAgICAgfVxuICAgICAgZ3JvdXBzW2dyb3VwXS5wdXNoKFt0aGlzLiR3YXRjaGVkW2ldLHRoaXMuJHdhdGNoZWRbaV0ub2Zmc2V0SGVpZ2h0XSk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaiA9IDAsIGxuID0gZ3JvdXBzLmxlbmd0aDsgaiA8IGxuOyBqKyspIHtcbiAgICAgIHZhciBoZWlnaHRzID0gJChncm91cHNbal0pLm1hcChmdW5jdGlvbigpeyByZXR1cm4gdGhpc1sxXTsgfSkuZ2V0KCk7XG4gICAgICB2YXIgbWF4ICAgICAgICAgPSBNYXRoLm1heC5hcHBseShudWxsLCBoZWlnaHRzKTtcbiAgICAgIGdyb3Vwc1tqXS5wdXNoKG1heCk7XG4gICAgfVxuICAgIGNiKGdyb3Vwcyk7XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlcyB0aGUgQ1NTIGhlaWdodCBwcm9wZXJ0eSBvZiBlYWNoIGNoaWxkIGluIGFuIEVxdWFsaXplciBwYXJlbnQgdG8gbWF0Y2ggdGhlIHRhbGxlc3RcbiAgICogQHBhcmFtIHthcnJheX0gaGVpZ2h0cyAtIEFuIGFycmF5IG9mIGhlaWdodHMgb2YgY2hpbGRyZW4gd2l0aGluIEVxdWFsaXplciBjb250YWluZXJcbiAgICogQGZpcmVzIEVxdWFsaXplciNwcmVlcXVhbGl6ZWRcbiAgICogQGZpcmVzIEVxdWFsaXplciNwb3N0ZXF1YWxpemVkXG4gICAqL1xuICBhcHBseUhlaWdodChoZWlnaHRzKSB7XG4gICAgdmFyIG1heCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGhlaWdodHMpO1xuICAgIC8qKlxuICAgICAqIEZpcmVzIGJlZm9yZSB0aGUgaGVpZ2h0cyBhcmUgYXBwbGllZFxuICAgICAqIEBldmVudCBFcXVhbGl6ZXIjcHJlZXF1YWxpemVkXG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwcmVlcXVhbGl6ZWQuemYuZXF1YWxpemVyJyk7XG5cbiAgICB0aGlzLiR3YXRjaGVkLmNzcygnaGVpZ2h0JywgbWF4KTtcblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIGhlaWdodHMgaGF2ZSBiZWVuIGFwcGxpZWRcbiAgICAgKiBAZXZlbnQgRXF1YWxpemVyI3Bvc3RlcXVhbGl6ZWRcbiAgICAgKi9cbiAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwb3N0ZXF1YWxpemVkLnpmLmVxdWFsaXplcicpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoYW5nZXMgdGhlIENTUyBoZWlnaHQgcHJvcGVydHkgb2YgZWFjaCBjaGlsZCBpbiBhbiBFcXVhbGl6ZXIgcGFyZW50IHRvIG1hdGNoIHRoZSB0YWxsZXN0IGJ5IHJvd1xuICAgKiBAcGFyYW0ge2FycmF5fSBncm91cHMgLSBBbiBhcnJheSBvZiBoZWlnaHRzIG9mIGNoaWxkcmVuIHdpdGhpbiBFcXVhbGl6ZXIgY29udGFpbmVyIGdyb3VwZWQgYnkgcm93IHdpdGggZWxlbWVudCxoZWlnaHQgYW5kIG1heCBhcyBsYXN0IGNoaWxkXG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcHJlZXF1YWxpemVkXG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcHJlZXF1YWxpemVkUm93XG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcG9zdGVxdWFsaXplZFJvd1xuICAgKiBAZmlyZXMgRXF1YWxpemVyI3Bvc3RlcXVhbGl6ZWRcbiAgICovXG4gIGFwcGx5SGVpZ2h0QnlSb3coZ3JvdXBzKSB7XG4gICAgLyoqXG4gICAgICogRmlyZXMgYmVmb3JlIHRoZSBoZWlnaHRzIGFyZSBhcHBsaWVkXG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwcmVlcXVhbGl6ZWQuemYuZXF1YWxpemVyJyk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGdyb3Vwcy5sZW5ndGg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgIHZhciBncm91cHNJTGVuZ3RoID0gZ3JvdXBzW2ldLmxlbmd0aCxcbiAgICAgICAgICBtYXggPSBncm91cHNbaV1bZ3JvdXBzSUxlbmd0aCAtIDFdO1xuICAgICAgaWYgKGdyb3Vwc0lMZW5ndGg8PTIpIHtcbiAgICAgICAgJChncm91cHNbaV1bMF1bMF0pLmNzcyh7J2hlaWdodCc6J2F1dG8nfSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLyoqXG4gICAgICAgICogRmlyZXMgYmVmb3JlIHRoZSBoZWlnaHRzIHBlciByb3cgYXJlIGFwcGxpZWRcbiAgICAgICAgKiBAZXZlbnQgRXF1YWxpemVyI3ByZWVxdWFsaXplZFJvd1xuICAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwcmVlcXVhbGl6ZWRyb3cuemYuZXF1YWxpemVyJyk7XG4gICAgICBmb3IgKHZhciBqID0gMCwgbGVuSiA9IChncm91cHNJTGVuZ3RoLTEpOyBqIDwgbGVuSiA7IGorKykge1xuICAgICAgICAkKGdyb3Vwc1tpXVtqXVswXSkuY3NzKHsnaGVpZ2h0JzptYXh9KTtcbiAgICAgIH1cbiAgICAgIC8qKlxuICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIGhlaWdodHMgcGVyIHJvdyBoYXZlIGJlZW4gYXBwbGllZFxuICAgICAgICAqIEBldmVudCBFcXVhbGl6ZXIjcG9zdGVxdWFsaXplZFJvd1xuICAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwb3N0ZXF1YWxpemVkcm93LnpmLmVxdWFsaXplcicpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBoZWlnaHRzIGhhdmUgYmVlbiBhcHBsaWVkXG4gICAgICovXG4gICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigncG9zdGVxdWFsaXplZC56Zi5lcXVhbGl6ZXInKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiBFcXVhbGl6ZXIuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLl9wYXVzZUV2ZW50cygpO1xuICAgIHRoaXMuJHdhdGNoZWQuY3NzKCdoZWlnaHQnLCAnYXV0bycpO1xuXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cbi8qKlxuICogRGVmYXVsdCBzZXR0aW5ncyBmb3IgcGx1Z2luXG4gKi9cbkVxdWFsaXplci5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIEVuYWJsZSBoZWlnaHQgZXF1YWxpemF0aW9uIHdoZW4gc3RhY2tlZCBvbiBzbWFsbGVyIHNjcmVlbnMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgZXF1YWxpemVPblN0YWNrOiB0cnVlLFxuICAvKipcbiAgICogRW5hYmxlIGhlaWdodCBlcXVhbGl6YXRpb24gcm93IGJ5IHJvdy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgZXF1YWxpemVCeVJvdzogZmFsc2UsXG4gIC8qKlxuICAgKiBTdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBtaW5pbXVtIGJyZWFrcG9pbnQgc2l6ZSB0aGUgcGx1Z2luIHNob3VsZCBlcXVhbGl6ZSBoZWlnaHRzIG9uLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdtZWRpdW0nXG4gICAqL1xuICBlcXVhbGl6ZU9uOiAnJ1xufTtcblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKEVxdWFsaXplciwgJ0VxdWFsaXplcicpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogSW50ZXJjaGFuZ2UgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmludGVyY2hhbmdlXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudGltZXJBbmRJbWFnZUxvYWRlclxuICovXG5cbmNsYXNzIEludGVyY2hhbmdlIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgSW50ZXJjaGFuZ2UuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgSW50ZXJjaGFuZ2UjaW5pdFxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYWRkIHRoZSB0cmlnZ2VyIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIEludGVyY2hhbmdlLmRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICB0aGlzLnJ1bGVzID0gW107XG4gICAgdGhpcy5jdXJyZW50UGF0aCA9ICcnO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuICAgIHRoaXMuX2V2ZW50cygpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnSW50ZXJjaGFuZ2UnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgSW50ZXJjaGFuZ2UgcGx1Z2luIGFuZCBjYWxscyBmdW5jdGlvbnMgdG8gZ2V0IGludGVyY2hhbmdlIGZ1bmN0aW9uaW5nIG9uIGxvYWQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdGhpcy5fYWRkQnJlYWtwb2ludHMoKTtcbiAgICB0aGlzLl9nZW5lcmF0ZVJ1bGVzKCk7XG4gICAgdGhpcy5fcmVmbG93KCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciBJbnRlcmNoYW5nZS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgICQod2luZG93KS5vbigncmVzaXplLnpmLmludGVyY2hhbmdlJywgRm91bmRhdGlvbi51dGlsLnRocm90dGxlKHRoaXMuX3JlZmxvdy5iaW5kKHRoaXMpLCA1MCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxzIG5lY2Vzc2FyeSBmdW5jdGlvbnMgdG8gdXBkYXRlIEludGVyY2hhbmdlIHVwb24gRE9NIGNoYW5nZVxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9yZWZsb3coKSB7XG4gICAgdmFyIG1hdGNoO1xuXG4gICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGVhY2ggcnVsZSwgYnV0IG9ubHkgc2F2ZSB0aGUgbGFzdCBtYXRjaFxuICAgIGZvciAodmFyIGkgaW4gdGhpcy5ydWxlcykge1xuICAgICAgdmFyIHJ1bGUgPSB0aGlzLnJ1bGVzW2ldO1xuXG4gICAgICBpZiAod2luZG93Lm1hdGNoTWVkaWEocnVsZS5xdWVyeSkubWF0Y2hlcykge1xuICAgICAgICBtYXRjaCA9IHJ1bGU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICB0aGlzLnJlcGxhY2UobWF0Y2gucGF0aCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIEZvdW5kYXRpb24gYnJlYWtwb2ludHMgYW5kIGFkZHMgdGhlbSB0byB0aGUgSW50ZXJjaGFuZ2UuU1BFQ0lBTF9RVUVSSUVTIG9iamVjdC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfYWRkQnJlYWtwb2ludHMoKSB7XG4gICAgZm9yICh2YXIgaSBpbiBGb3VuZGF0aW9uLk1lZGlhUXVlcnkucXVlcmllcykge1xuICAgICAgdmFyIHF1ZXJ5ID0gRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LnF1ZXJpZXNbaV07XG4gICAgICBJbnRlcmNoYW5nZS5TUEVDSUFMX1FVRVJJRVNbcXVlcnkubmFtZV0gPSBxdWVyeS52YWx1ZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSBJbnRlcmNoYW5nZSBlbGVtZW50IGZvciB0aGUgcHJvdmlkZWQgbWVkaWEgcXVlcnkgKyBjb250ZW50IHBhaXJpbmdzXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdGhhdCBpcyBhbiBJbnRlcmNoYW5nZSBpbnN0YW5jZVxuICAgKiBAcmV0dXJucyB7QXJyYXl9IHNjZW5hcmlvcyAtIEFycmF5IG9mIG9iamVjdHMgdGhhdCBoYXZlICdtcScgYW5kICdwYXRoJyBrZXlzIHdpdGggY29ycmVzcG9uZGluZyBrZXlzXG4gICAqL1xuICBfZ2VuZXJhdGVSdWxlcyhlbGVtZW50KSB7XG4gICAgdmFyIHJ1bGVzTGlzdCA9IFtdO1xuICAgIHZhciBydWxlcztcblxuICAgIGlmICh0aGlzLm9wdGlvbnMucnVsZXMpIHtcbiAgICAgIHJ1bGVzID0gdGhpcy5vcHRpb25zLnJ1bGVzO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJ1bGVzID0gdGhpcy4kZWxlbWVudC5kYXRhKCdpbnRlcmNoYW5nZScpLm1hdGNoKC9cXFsuKj9cXF0vZyk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSBpbiBydWxlcykge1xuICAgICAgdmFyIHJ1bGUgPSBydWxlc1tpXS5zbGljZSgxLCAtMSkuc3BsaXQoJywgJyk7XG4gICAgICB2YXIgcGF0aCA9IHJ1bGUuc2xpY2UoMCwgLTEpLmpvaW4oJycpO1xuICAgICAgdmFyIHF1ZXJ5ID0gcnVsZVtydWxlLmxlbmd0aCAtIDFdO1xuXG4gICAgICBpZiAoSW50ZXJjaGFuZ2UuU1BFQ0lBTF9RVUVSSUVTW3F1ZXJ5XSkge1xuICAgICAgICBxdWVyeSA9IEludGVyY2hhbmdlLlNQRUNJQUxfUVVFUklFU1txdWVyeV07XG4gICAgICB9XG5cbiAgICAgIHJ1bGVzTGlzdC5wdXNoKHtcbiAgICAgICAgcGF0aDogcGF0aCxcbiAgICAgICAgcXVlcnk6IHF1ZXJ5XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLnJ1bGVzID0gcnVsZXNMaXN0O1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgYHNyY2AgcHJvcGVydHkgb2YgYW4gaW1hZ2UsIG9yIGNoYW5nZSB0aGUgSFRNTCBvZiBhIGNvbnRhaW5lciwgdG8gdGhlIHNwZWNpZmllZCBwYXRoLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggLSBQYXRoIHRvIHRoZSBpbWFnZSBvciBIVE1MIHBhcnRpYWwuXG4gICAqIEBmaXJlcyBJbnRlcmNoYW5nZSNyZXBsYWNlZFxuICAgKi9cbiAgcmVwbGFjZShwYXRoKSB7XG4gICAgaWYgKHRoaXMuY3VycmVudFBhdGggPT09IHBhdGgpIHJldHVybjtcblxuICAgIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICAgIHRyaWdnZXIgPSAncmVwbGFjZWQuemYuaW50ZXJjaGFuZ2UnO1xuXG4gICAgLy8gUmVwbGFjaW5nIGltYWdlc1xuICAgIGlmICh0aGlzLiRlbGVtZW50WzBdLm5vZGVOYW1lID09PSAnSU1HJykge1xuICAgICAgdGhpcy4kZWxlbWVudC5hdHRyKCdzcmMnLCBwYXRoKS5sb2FkKGZ1bmN0aW9uKCkge1xuICAgICAgICBfdGhpcy5jdXJyZW50UGF0aCA9IHBhdGg7XG4gICAgICB9KVxuICAgICAgLnRyaWdnZXIodHJpZ2dlcik7XG4gICAgfVxuICAgIC8vIFJlcGxhY2luZyBiYWNrZ3JvdW5kIGltYWdlc1xuICAgIGVsc2UgaWYgKHBhdGgubWF0Y2goL1xcLihnaWZ8anBnfGpwZWd8cG5nfHN2Z3x0aWZmKShbPyNdLiopPy9pKSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5jc3MoeyAnYmFja2dyb3VuZC1pbWFnZSc6ICd1cmwoJytwYXRoKycpJyB9KVxuICAgICAgICAgIC50cmlnZ2VyKHRyaWdnZXIpO1xuICAgIH1cbiAgICAvLyBSZXBsYWNpbmcgSFRNTFxuICAgIGVsc2Uge1xuICAgICAgJC5nZXQocGF0aCwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgX3RoaXMuJGVsZW1lbnQuaHRtbChyZXNwb25zZSlcbiAgICAgICAgICAgICAudHJpZ2dlcih0cmlnZ2VyKTtcbiAgICAgICAgJChyZXNwb25zZSkuZm91bmRhdGlvbigpO1xuICAgICAgICBfdGhpcy5jdXJyZW50UGF0aCA9IHBhdGg7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIGNvbnRlbnQgaW4gYW4gSW50ZXJjaGFuZ2UgZWxlbWVudCBpcyBkb25lIGJlaW5nIGxvYWRlZC5cbiAgICAgKiBAZXZlbnQgSW50ZXJjaGFuZ2UjcmVwbGFjZWRcbiAgICAgKi9cbiAgICAvLyB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3JlcGxhY2VkLnpmLmludGVyY2hhbmdlJyk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgaW50ZXJjaGFuZ2UuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICAvL1RPRE8gdGhpcy5cbiAgfVxufVxuXG4vKipcbiAqIERlZmF1bHQgc2V0dGluZ3MgZm9yIHBsdWdpblxuICovXG5JbnRlcmNoYW5nZS5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIFJ1bGVzIHRvIGJlIGFwcGxpZWQgdG8gSW50ZXJjaGFuZ2UgZWxlbWVudHMuIFNldCB3aXRoIHRoZSBgZGF0YS1pbnRlcmNoYW5nZWAgYXJyYXkgbm90YXRpb24uXG4gICAqIEBvcHRpb25cbiAgICovXG4gIHJ1bGVzOiBudWxsXG59O1xuXG5JbnRlcmNoYW5nZS5TUEVDSUFMX1FVRVJJRVMgPSB7XG4gICdsYW5kc2NhcGUnOiAnc2NyZWVuIGFuZCAob3JpZW50YXRpb246IGxhbmRzY2FwZSknLFxuICAncG9ydHJhaXQnOiAnc2NyZWVuIGFuZCAob3JpZW50YXRpb246IHBvcnRyYWl0KScsXG4gICdyZXRpbmEnOiAnb25seSBzY3JlZW4gYW5kICgtd2Via2l0LW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCBvbmx5IHNjcmVlbiBhbmQgKG1pbi0tbW96LWRldmljZS1waXhlbC1yYXRpbzogMiksIG9ubHkgc2NyZWVuIGFuZCAoLW8tbWluLWRldmljZS1waXhlbC1yYXRpbzogMi8xKSwgb25seSBzY3JlZW4gYW5kIChtaW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwgb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMTkyZHBpKSwgb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMmRwcHgpJ1xufTtcblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKEludGVyY2hhbmdlLCAnSW50ZXJjaGFuZ2UnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIE1hZ2VsbGFuIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5tYWdlbGxhblxuICovXG5cbmNsYXNzIE1hZ2VsbGFuIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgTWFnZWxsYW4uXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgTWFnZWxsYW4jaW5pdFxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYWRkIHRoZSB0cmlnZ2VyIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zICA9ICQuZXh0ZW5kKHt9LCBNYWdlbGxhbi5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnTWFnZWxsYW4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgTWFnZWxsYW4gcGx1Z2luIGFuZCBjYWxscyBmdW5jdGlvbnMgdG8gZ2V0IGVxdWFsaXplciBmdW5jdGlvbmluZyBvbiBsb2FkLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIGlkID0gdGhpcy4kZWxlbWVudFswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdtYWdlbGxhbicpO1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy4kdGFyZ2V0cyA9ICQoJ1tkYXRhLW1hZ2VsbGFuLXRhcmdldF0nKTtcbiAgICB0aGlzLiRsaW5rcyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnYScpO1xuICAgIHRoaXMuJGVsZW1lbnQuYXR0cih7XG4gICAgICAnZGF0YS1yZXNpemUnOiBpZCxcbiAgICAgICdkYXRhLXNjcm9sbCc6IGlkLFxuICAgICAgJ2lkJzogaWRcbiAgICB9KTtcbiAgICB0aGlzLiRhY3RpdmUgPSAkKCk7XG4gICAgdGhpcy5zY3JvbGxQb3MgPSBwYXJzZUludCh3aW5kb3cucGFnZVlPZmZzZXQsIDEwKTtcblxuICAgIHRoaXMuX2V2ZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgYW4gYXJyYXkgb2YgcGl4ZWwgdmFsdWVzIHRoYXQgYXJlIHRoZSBkZW1hcmNhdGlvbiBsaW5lcyBiZXR3ZWVuIGxvY2F0aW9ucyBvbiB0aGUgcGFnZS5cbiAgICogQ2FuIGJlIGludm9rZWQgaWYgbmV3IGVsZW1lbnRzIGFyZSBhZGRlZCBvciB0aGUgc2l6ZSBvZiBhIGxvY2F0aW9uIGNoYW5nZXMuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgY2FsY1BvaW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICBib2R5ID0gZG9jdW1lbnQuYm9keSxcbiAgICAgICAgaHRtbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxuICAgIHRoaXMucG9pbnRzID0gW107XG4gICAgdGhpcy53aW5IZWlnaHQgPSBNYXRoLnJvdW5kKE1hdGgubWF4KHdpbmRvdy5pbm5lckhlaWdodCwgaHRtbC5jbGllbnRIZWlnaHQpKTtcbiAgICB0aGlzLmRvY0hlaWdodCA9IE1hdGgucm91bmQoTWF0aC5tYXgoYm9keS5zY3JvbGxIZWlnaHQsIGJvZHkub2Zmc2V0SGVpZ2h0LCBodG1sLmNsaWVudEhlaWdodCwgaHRtbC5zY3JvbGxIZWlnaHQsIGh0bWwub2Zmc2V0SGVpZ2h0KSk7XG5cbiAgICB0aGlzLiR0YXJnZXRzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgIHZhciAkdGFyID0gJCh0aGlzKSxcbiAgICAgICAgICBwdCA9IE1hdGgucm91bmQoJHRhci5vZmZzZXQoKS50b3AgLSBfdGhpcy5vcHRpb25zLnRocmVzaG9sZCk7XG4gICAgICAkdGFyLnRhcmdldFBvaW50ID0gcHQ7XG4gICAgICBfdGhpcy5wb2ludHMucHVzaChwdCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciBNYWdlbGxhbi5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcyxcbiAgICAgICAgJGJvZHkgPSAkKCdodG1sLCBib2R5JyksXG4gICAgICAgIG9wdHMgPSB7XG4gICAgICAgICAgZHVyYXRpb246IF90aGlzLm9wdGlvbnMuYW5pbWF0aW9uRHVyYXRpb24sXG4gICAgICAgICAgZWFzaW5nOiAgIF90aGlzLm9wdGlvbnMuYW5pbWF0aW9uRWFzaW5nXG4gICAgICAgIH07XG4gICAgJCh3aW5kb3cpLm9uZSgnbG9hZCcsIGZ1bmN0aW9uKCl7XG4gICAgICBpZihfdGhpcy5vcHRpb25zLmRlZXBMaW5raW5nKXtcbiAgICAgICAgaWYobG9jYXRpb24uaGFzaCl7XG4gICAgICAgICAgX3RoaXMuc2Nyb2xsVG9Mb2MobG9jYXRpb24uaGFzaCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIF90aGlzLmNhbGNQb2ludHMoKTtcbiAgICAgIF90aGlzLl91cGRhdGVBY3RpdmUoKTtcbiAgICB9KTtcblxuICAgIHRoaXMuJGVsZW1lbnQub24oe1xuICAgICAgJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInOiB0aGlzLnJlZmxvdy5iaW5kKHRoaXMpLFxuICAgICAgJ3Njcm9sbG1lLnpmLnRyaWdnZXInOiB0aGlzLl91cGRhdGVBY3RpdmUuYmluZCh0aGlzKVxuICAgIH0pLm9uKCdjbGljay56Zi5tYWdlbGxhbicsICdhW2hyZWZePVwiI1wiXScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgYXJyaXZhbCAgID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcbiAgICAgICAgX3RoaXMuc2Nyb2xsVG9Mb2MoYXJyaXZhbCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRnVuY3Rpb24gdG8gc2Nyb2xsIHRvIGEgZ2l2ZW4gbG9jYXRpb24gb24gdGhlIHBhZ2UuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBsb2MgLSBhIHByb3Blcmx5IGZvcm1hdHRlZCBqUXVlcnkgaWQgc2VsZWN0b3IuIEV4YW1wbGU6ICcjZm9vJ1xuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHNjcm9sbFRvTG9jKGxvYykge1xuICAgIHZhciBzY3JvbGxQb3MgPSBNYXRoLnJvdW5kKCQobG9jKS5vZmZzZXQoKS50b3AgLSB0aGlzLm9wdGlvbnMudGhyZXNob2xkIC8gMiAtIHRoaXMub3B0aW9ucy5iYXJPZmZzZXQpO1xuXG4gICAgJCgnaHRtbCwgYm9keScpLnN0b3AodHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogc2Nyb2xsUG9zIH0sIHRoaXMub3B0aW9ucy5hbmltYXRpb25EdXJhdGlvbiwgdGhpcy5vcHRpb25zLmFuaW1hdGlvbkVhc2luZyk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbHMgbmVjZXNzYXJ5IGZ1bmN0aW9ucyB0byB1cGRhdGUgTWFnZWxsYW4gdXBvbiBET00gY2hhbmdlXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgcmVmbG93KCkge1xuICAgIHRoaXMuY2FsY1BvaW50cygpO1xuICAgIHRoaXMuX3VwZGF0ZUFjdGl2ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIHZpc2liaWxpdHkgb2YgYW4gYWN0aXZlIGxvY2F0aW9uIGxpbmssIGFuZCB1cGRhdGVzIHRoZSB1cmwgaGFzaCBmb3IgdGhlIHBhZ2UsIGlmIGRlZXBMaW5raW5nIGVuYWJsZWQuXG4gICAqIEBwcml2YXRlXG4gICAqIEBmdW5jdGlvblxuICAgKiBAZmlyZXMgTWFnZWxsYW4jdXBkYXRlXG4gICAqL1xuICBfdXBkYXRlQWN0aXZlKC8qZXZ0LCBlbGVtLCBzY3JvbGxQb3MqLykge1xuICAgIHZhciB3aW5Qb3MgPSAvKnNjcm9sbFBvcyB8fCovIHBhcnNlSW50KHdpbmRvdy5wYWdlWU9mZnNldCwgMTApLFxuICAgICAgICBjdXJJZHg7XG5cbiAgICBpZih3aW5Qb3MgKyB0aGlzLndpbkhlaWdodCA9PT0gdGhpcy5kb2NIZWlnaHQpeyBjdXJJZHggPSB0aGlzLnBvaW50cy5sZW5ndGggLSAxOyB9XG4gICAgZWxzZSBpZih3aW5Qb3MgPCB0aGlzLnBvaW50c1swXSl7IGN1cklkeCA9IDA7IH1cbiAgICBlbHNle1xuICAgICAgdmFyIGlzRG93biA9IHRoaXMuc2Nyb2xsUG9zIDwgd2luUG9zLFxuICAgICAgICAgIF90aGlzID0gdGhpcyxcbiAgICAgICAgICBjdXJWaXNpYmxlID0gdGhpcy5wb2ludHMuZmlsdGVyKGZ1bmN0aW9uKHAsIGkpe1xuICAgICAgICAgICAgcmV0dXJuIGlzRG93biA/IHAgPD0gd2luUG9zIDogcCAtIF90aGlzLm9wdGlvbnMudGhyZXNob2xkIDw9IHdpblBvczsvLyYmIHdpblBvcyA+PSBfdGhpcy5wb2ludHNbaSAtMV0gLSBfdGhpcy5vcHRpb25zLnRocmVzaG9sZDtcbiAgICAgICAgICB9KTtcbiAgICAgIGN1cklkeCA9IGN1clZpc2libGUubGVuZ3RoID8gY3VyVmlzaWJsZS5sZW5ndGggLSAxIDogMDtcbiAgICB9XG5cbiAgICB0aGlzLiRhY3RpdmUucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcbiAgICB0aGlzLiRhY3RpdmUgPSB0aGlzLiRsaW5rcy5lcShjdXJJZHgpLmFkZENsYXNzKHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XG5cbiAgICBpZih0aGlzLm9wdGlvbnMuZGVlcExpbmtpbmcpe1xuICAgICAgdmFyIGhhc2ggPSB0aGlzLiRhY3RpdmVbMF0uZ2V0QXR0cmlidXRlKCdocmVmJyk7XG4gICAgICBpZih3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUpe1xuICAgICAgICB3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUobnVsbCwgbnVsbCwgaGFzaCk7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBoYXNoO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuc2Nyb2xsUG9zID0gd2luUG9zO1xuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gbWFnZWxsYW4gaXMgZmluaXNoZWQgdXBkYXRpbmcgdG8gdGhlIG5ldyBhY3RpdmUgZWxlbWVudC5cbiAgICAgKiBAZXZlbnQgTWFnZWxsYW4jdXBkYXRlXG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCd1cGRhdGUuemYubWFnZWxsYW4nLCBbdGhpcy4kYWN0aXZlXSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgTWFnZWxsYW4gYW5kIHJlc2V0cyB0aGUgdXJsIG9mIHRoZSB3aW5kb3cuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRyaWdnZXIgLnpmLm1hZ2VsbGFuJylcbiAgICAgICAgLmZpbmQoYC4ke3RoaXMub3B0aW9ucy5hY3RpdmVDbGFzc31gKS5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpO1xuXG4gICAgaWYodGhpcy5vcHRpb25zLmRlZXBMaW5raW5nKXtcbiAgICAgIHZhciBoYXNoID0gdGhpcy4kYWN0aXZlWzBdLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xuICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2gucmVwbGFjZShoYXNoLCAnJyk7XG4gICAgfVxuXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cbi8qKlxuICogRGVmYXVsdCBzZXR0aW5ncyBmb3IgcGx1Z2luXG4gKi9cbk1hZ2VsbGFuLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogQW1vdW50IG9mIHRpbWUsIGluIG1zLCB0aGUgYW5pbWF0ZWQgc2Nyb2xsaW5nIHNob3VsZCB0YWtlIGJldHdlZW4gbG9jYXRpb25zLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDUwMFxuICAgKi9cbiAgYW5pbWF0aW9uRHVyYXRpb246IDUwMCxcbiAgLyoqXG4gICAqIEFuaW1hdGlvbiBzdHlsZSB0byB1c2Ugd2hlbiBzY3JvbGxpbmcgYmV0d2VlbiBsb2NhdGlvbnMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ2Vhc2UtaW4tb3V0J1xuICAgKi9cbiAgYW5pbWF0aW9uRWFzaW5nOiAnbGluZWFyJyxcbiAgLyoqXG4gICAqIE51bWJlciBvZiBwaXhlbHMgdG8gdXNlIGFzIGEgbWFya2VyIGZvciBsb2NhdGlvbiBjaGFuZ2VzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDUwXG4gICAqL1xuICB0aHJlc2hvbGQ6IDUwLFxuICAvKipcbiAgICogQ2xhc3MgYXBwbGllZCB0byB0aGUgYWN0aXZlIGxvY2F0aW9ucyBsaW5rIG9uIHRoZSBtYWdlbGxhbiBjb250YWluZXIuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ2FjdGl2ZSdcbiAgICovXG4gIGFjdGl2ZUNsYXNzOiAnYWN0aXZlJyxcbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgc2NyaXB0IHRvIG1hbmlwdWxhdGUgdGhlIHVybCBvZiB0aGUgY3VycmVudCBwYWdlLCBhbmQgaWYgc3VwcG9ydGVkLCBhbHRlciB0aGUgaGlzdG9yeS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBkZWVwTGlua2luZzogZmFsc2UsXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcGl4ZWxzIHRvIG9mZnNldCB0aGUgc2Nyb2xsIG9mIHRoZSBwYWdlIG9uIGl0ZW0gY2xpY2sgaWYgdXNpbmcgYSBzdGlja3kgbmF2IGJhci5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAyNVxuICAgKi9cbiAgYmFyT2Zmc2V0OiAwXG59XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihNYWdlbGxhbiwgJ01hZ2VsbGFuJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBPZmZDYW52YXMgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLm9mZmNhbnZhc1xuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxuICovXG5cbmNsYXNzIE9mZkNhbnZhcyB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFuIG9mZi1jYW52YXMgd3JhcHBlci5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBPZmZDYW52YXMjaW5pdFxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gaW5pdGlhbGl6ZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBPZmZDYW52YXMuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcbiAgICB0aGlzLiRsYXN0VHJpZ2dlciA9ICQoKTtcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLl9ldmVudHMoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ09mZkNhbnZhcycpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBvZmYtY2FudmFzIHdyYXBwZXIgYnkgYWRkaW5nIHRoZSBleGl0IG92ZXJsYXkgKGlmIG5lZWRlZCkuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIGlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdpZCcpO1xuXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG5cbiAgICAvLyBGaW5kIHRyaWdnZXJzIHRoYXQgYWZmZWN0IHRoaXMgZWxlbWVudCBhbmQgYWRkIGFyaWEtZXhwYW5kZWQgdG8gdGhlbVxuICAgICQoZG9jdW1lbnQpXG4gICAgICAuZmluZCgnW2RhdGEtb3Blbj1cIicraWQrJ1wiXSwgW2RhdGEtY2xvc2U9XCInK2lkKydcIl0sIFtkYXRhLXRvZ2dsZT1cIicraWQrJ1wiXScpXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpXG4gICAgICAuYXR0cignYXJpYS1jb250cm9scycsIGlkKTtcblxuICAgIC8vIEFkZCBhIGNsb3NlIHRyaWdnZXIgb3ZlciB0aGUgYm9keSBpZiBuZWNlc3NhcnlcbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljaykge1xuICAgICAgaWYgKCQoJy5qcy1vZmYtY2FudmFzLWV4aXQnKS5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy4kZXhpdGVyID0gJCgnLmpzLW9mZi1jYW52YXMtZXhpdCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGV4aXRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBleGl0ZXIuc2V0QXR0cmlidXRlKCdjbGFzcycsICdqcy1vZmYtY2FudmFzLWV4aXQnKTtcbiAgICAgICAgJCgnW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XScpLmFwcGVuZChleGl0ZXIpO1xuXG4gICAgICAgIHRoaXMuJGV4aXRlciA9ICQoZXhpdGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMuaXNSZXZlYWxlZCA9IHRoaXMub3B0aW9ucy5pc1JldmVhbGVkIHx8IG5ldyBSZWdFeHAodGhpcy5vcHRpb25zLnJldmVhbENsYXNzLCAnZycpLnRlc3QodGhpcy4kZWxlbWVudFswXS5jbGFzc05hbWUpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5pc1JldmVhbGVkKSB7XG4gICAgICB0aGlzLm9wdGlvbnMucmV2ZWFsT24gPSB0aGlzLm9wdGlvbnMucmV2ZWFsT24gfHwgdGhpcy4kZWxlbWVudFswXS5jbGFzc05hbWUubWF0Y2goLyhyZXZlYWwtZm9yLW1lZGl1bXxyZXZlYWwtZm9yLWxhcmdlKS9nKVswXS5zcGxpdCgnLScpWzJdO1xuICAgICAgdGhpcy5fc2V0TVFDaGVja2VyKCk7XG4gICAgfVxuICAgIGlmICghdGhpcy5vcHRpb25zLnRyYW5zaXRpb25UaW1lKSB7XG4gICAgICB0aGlzLm9wdGlvbnMudHJhbnNpdGlvblRpbWUgPSBwYXJzZUZsb2F0KHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKCQoJ1tkYXRhLW9mZi1jYW52YXMtd3JhcHBlcl0nKVswXSkudHJhbnNpdGlvbkR1cmF0aW9uKSAqIDEwMDA7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgdG8gdGhlIG9mZi1jYW52YXMgd3JhcHBlciBhbmQgdGhlIGV4aXQgb3ZlcmxheS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYudHJpZ2dlciAuemYub2ZmY2FudmFzJykub24oe1xuICAgICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxuICAgICAgJ2Nsb3NlLnpmLnRyaWdnZXInOiB0aGlzLmNsb3NlLmJpbmQodGhpcyksXG4gICAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxuICAgICAgJ2tleWRvd24uemYub2ZmY2FudmFzJzogdGhpcy5faGFuZGxlS2V5Ym9hcmQuYmluZCh0aGlzKVxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2sgJiYgdGhpcy4kZXhpdGVyLmxlbmd0aCkge1xuICAgICAgdGhpcy4kZXhpdGVyLm9uKHsnY2xpY2suemYub2ZmY2FudmFzJzogdGhpcy5jbG9zZS5iaW5kKHRoaXMpfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgZXZlbnQgbGlzdGVuZXIgZm9yIGVsZW1lbnRzIHRoYXQgd2lsbCByZXZlYWwgYXQgY2VydGFpbiBicmVha3BvaW50cy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9zZXRNUUNoZWNrZXIoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICQod2luZG93KS5vbignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QoX3RoaXMub3B0aW9ucy5yZXZlYWxPbikpIHtcbiAgICAgICAgX3RoaXMucmV2ZWFsKHRydWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX3RoaXMucmV2ZWFsKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9KS5vbmUoJ2xvYWQuemYub2ZmY2FudmFzJywgZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QoX3RoaXMub3B0aW9ucy5yZXZlYWxPbikpIHtcbiAgICAgICAgX3RoaXMucmV2ZWFsKHRydWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgdGhlIHJldmVhbGluZy9oaWRpbmcgdGhlIG9mZi1jYW52YXMgYXQgYnJlYWtwb2ludHMsIG5vdCB0aGUgc2FtZSBhcyBvcGVuLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGlzUmV2ZWFsZWQgLSB0cnVlIGlmIGVsZW1lbnQgc2hvdWxkIGJlIHJldmVhbGVkLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHJldmVhbChpc1JldmVhbGVkKSB7XG4gICAgdmFyICRjbG9zZXIgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLWNsb3NlXScpO1xuICAgIGlmIChpc1JldmVhbGVkKSB7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB0aGlzLmlzUmV2ZWFsZWQgPSB0cnVlO1xuICAgICAgLy8gaWYgKCF0aGlzLm9wdGlvbnMuZm9yY2VUb3ApIHtcbiAgICAgIC8vICAgdmFyIHNjcm9sbFBvcyA9IHBhcnNlSW50KHdpbmRvdy5wYWdlWU9mZnNldCk7XG4gICAgICAvLyAgIHRoaXMuJGVsZW1lbnRbMF0uc3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgwLCcgKyBzY3JvbGxQb3MgKyAncHgpJztcbiAgICAgIC8vIH1cbiAgICAgIC8vIGlmICh0aGlzLm9wdGlvbnMuaXNTdGlja3kpIHsgdGhpcy5fc3RpY2soKTsgfVxuICAgICAgdGhpcy4kZWxlbWVudC5vZmYoJ29wZW4uemYudHJpZ2dlciB0b2dnbGUuemYudHJpZ2dlcicpO1xuICAgICAgaWYgKCRjbG9zZXIubGVuZ3RoKSB7ICRjbG9zZXIuaGlkZSgpOyB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaXNSZXZlYWxlZCA9IGZhbHNlO1xuICAgICAgLy8gaWYgKHRoaXMub3B0aW9ucy5pc1N0aWNreSB8fCAhdGhpcy5vcHRpb25zLmZvcmNlVG9wKSB7XG4gICAgICAvLyAgIHRoaXMuJGVsZW1lbnRbMF0uc3R5bGUudHJhbnNmb3JtID0gJyc7XG4gICAgICAvLyAgICQod2luZG93KS5vZmYoJ3Njcm9sbC56Zi5vZmZjYW52YXMnKTtcbiAgICAgIC8vIH1cbiAgICAgIHRoaXMuJGVsZW1lbnQub24oe1xuICAgICAgICAnb3Blbi56Zi50cmlnZ2VyJzogdGhpcy5vcGVuLmJpbmQodGhpcyksXG4gICAgICAgICd0b2dnbGUuemYudHJpZ2dlcic6IHRoaXMudG9nZ2xlLmJpbmQodGhpcylcbiAgICAgIH0pO1xuICAgICAgaWYgKCRjbG9zZXIubGVuZ3RoKSB7XG4gICAgICAgICRjbG9zZXIuc2hvdygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyB0aGUgb2ZmLWNhbnZhcyBtZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gRXZlbnQgb2JqZWN0IHBhc3NlZCBmcm9tIGxpc3RlbmVyLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gdHJpZ2dlciAtIGVsZW1lbnQgdGhhdCB0cmlnZ2VyZWQgdGhlIG9mZi1jYW52YXMgdG8gb3Blbi5cbiAgICogQGZpcmVzIE9mZkNhbnZhcyNvcGVuZWRcbiAgICovXG4gIG9wZW4oZXZlbnQsIHRyaWdnZXIpIHtcbiAgICBpZiAodGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpIHx8IHRoaXMuaXNSZXZlYWxlZCkgeyByZXR1cm47IH1cbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmZvcmNlVG9wKSB7XG4gICAgICAkKCdib2R5Jykuc2Nyb2xsVG9wKDApO1xuICAgIH1cbiAgICAvLyB3aW5kb3cucGFnZVlPZmZzZXQgPSAwO1xuXG4gICAgLy8gaWYgKCF0aGlzLm9wdGlvbnMuZm9yY2VUb3ApIHtcbiAgICAvLyAgIHZhciBzY3JvbGxQb3MgPSBwYXJzZUludCh3aW5kb3cucGFnZVlPZmZzZXQpO1xuICAgIC8vICAgdGhpcy4kZWxlbWVudFswXS5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDAsJyArIHNjcm9sbFBvcyArICdweCknO1xuICAgIC8vICAgaWYgKHRoaXMuJGV4aXRlci5sZW5ndGgpIHtcbiAgICAvLyAgICAgdGhpcy4kZXhpdGVyWzBdLnN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGUoMCwnICsgc2Nyb2xsUG9zICsgJ3B4KSc7XG4gICAgLy8gICB9XG4gICAgLy8gfVxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIG9mZi1jYW52YXMgbWVudSBvcGVucy5cbiAgICAgKiBAZXZlbnQgT2ZmQ2FudmFzI29wZW5lZFxuICAgICAqL1xuICAgIEZvdW5kYXRpb24uTW92ZSh0aGlzLm9wdGlvbnMudHJhbnNpdGlvblRpbWUsIHRoaXMuJGVsZW1lbnQsIGZ1bmN0aW9uKCkge1xuICAgICAgJCgnW2RhdGEtb2ZmLWNhbnZhcy13cmFwcGVyXScpLmFkZENsYXNzKCdpcy1vZmYtY2FudmFzLW9wZW4gaXMtb3Blbi0nKyBfdGhpcy5vcHRpb25zLnBvc2l0aW9uKTtcblxuICAgICAgX3RoaXMuJGVsZW1lbnRcbiAgICAgICAgLmFkZENsYXNzKCdpcy1vcGVuJylcblxuICAgICAgLy8gaWYgKF90aGlzLm9wdGlvbnMuaXNTdGlja3kpIHtcbiAgICAgIC8vICAgX3RoaXMuX3N0aWNrKCk7XG4gICAgICAvLyB9XG4gICAgfSk7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpXG4gICAgICAgIC50cmlnZ2VyKCdvcGVuZWQuemYub2ZmY2FudmFzJyk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljaykge1xuICAgICAgdGhpcy4kZXhpdGVyLmFkZENsYXNzKCdpcy12aXNpYmxlJyk7XG4gICAgfVxuXG4gICAgaWYgKHRyaWdnZXIpIHtcbiAgICAgIHRoaXMuJGxhc3RUcmlnZ2VyID0gdHJpZ2dlci5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9Gb2N1cykge1xuICAgICAgdGhpcy4kZWxlbWVudC5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKHRoaXMuJGVsZW1lbnQpLCBmdW5jdGlvbigpIHtcbiAgICAgICAgX3RoaXMuJGVsZW1lbnQuZmluZCgnYSwgYnV0dG9uJykuZXEoMCkuZm9jdXMoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMudHJhcEZvY3VzKSB7XG4gICAgICAkKCdbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdJykuYXR0cigndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgIHRoaXMuX3RyYXBGb2N1cygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFwcyBmb2N1cyB3aXRoaW4gdGhlIG9mZmNhbnZhcyBvbiBvcGVuLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3RyYXBGb2N1cygpIHtcbiAgICB2YXIgZm9jdXNhYmxlID0gRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlKHRoaXMuJGVsZW1lbnQpLFxuICAgICAgICBmaXJzdCA9IGZvY3VzYWJsZS5lcSgwKSxcbiAgICAgICAgbGFzdCA9IGZvY3VzYWJsZS5lcSgtMSk7XG5cbiAgICBmb2N1c2FibGUub2ZmKCcuemYub2ZmY2FudmFzJykub24oJ2tleWRvd24uemYub2ZmY2FudmFzJywgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKGUud2hpY2ggPT09IDkgfHwgZS5rZXljb2RlID09PSA5KSB7XG4gICAgICAgIGlmIChlLnRhcmdldCA9PT0gbGFzdFswXSAmJiAhZS5zaGlmdEtleSkge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBmaXJzdC5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlLnRhcmdldCA9PT0gZmlyc3RbMF0gJiYgZS5zaGlmdEtleSkge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBsYXN0LmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIG9mZmNhbnZhcyB0byBhcHBlYXIgc3RpY2t5IHV0aWxpemluZyB0cmFuc2xhdGUgcHJvcGVydGllcy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIC8vIE9mZkNhbnZhcy5wcm90b3R5cGUuX3N0aWNrID0gZnVuY3Rpb24oKSB7XG4gIC8vICAgdmFyIGVsU3R5bGUgPSB0aGlzLiRlbGVtZW50WzBdLnN0eWxlO1xuICAvL1xuICAvLyAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKSB7XG4gIC8vICAgICB2YXIgZXhpdFN0eWxlID0gdGhpcy4kZXhpdGVyWzBdLnN0eWxlO1xuICAvLyAgIH1cbiAgLy9cbiAgLy8gICAkKHdpbmRvdykub24oJ3Njcm9sbC56Zi5vZmZjYW52YXMnLCBmdW5jdGlvbihlKSB7XG4gIC8vICAgICBjb25zb2xlLmxvZyhlKTtcbiAgLy8gICAgIHZhciBwYWdlWSA9IHdpbmRvdy5wYWdlWU9mZnNldDtcbiAgLy8gICAgIGVsU3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgwLCcgKyBwYWdlWSArICdweCknO1xuICAvLyAgICAgaWYgKGV4aXRTdHlsZSAhPT0gdW5kZWZpbmVkKSB7IGV4aXRTdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDAsJyArIHBhZ2VZICsgJ3B4KSc7IH1cbiAgLy8gICB9KTtcbiAgLy8gICAvLyB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3N0dWNrLnpmLm9mZmNhbnZhcycpO1xuICAvLyB9O1xuICAvKipcbiAgICogQ2xvc2VzIHRoZSBvZmYtY2FudmFzIG1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIG9wdGlvbmFsIGNiIHRvIGZpcmUgYWZ0ZXIgY2xvc3VyZS5cbiAgICogQGZpcmVzIE9mZkNhbnZhcyNjbG9zZWRcbiAgICovXG4gIGNsb3NlKGNiKSB7XG4gICAgaWYgKCF0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykgfHwgdGhpcy5pc1JldmVhbGVkKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8vICBGb3VuZGF0aW9uLk1vdmUodGhpcy5vcHRpb25zLnRyYW5zaXRpb25UaW1lLCB0aGlzLiRlbGVtZW50LCBmdW5jdGlvbigpIHtcbiAgICAkKCdbZGF0YS1vZmYtY2FudmFzLXdyYXBwZXJdJykucmVtb3ZlQ2xhc3MoYGlzLW9mZi1jYW52YXMtb3BlbiBpcy1vcGVuLSR7X3RoaXMub3B0aW9ucy5wb3NpdGlvbn1gKTtcbiAgICBfdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xuICAgICAgLy8gRm91bmRhdGlvbi5fcmVmbG93KCk7XG4gICAgLy8gfSk7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJylcbiAgICAgIC8qKlxuICAgICAgICogRmlyZXMgd2hlbiB0aGUgb2ZmLWNhbnZhcyBtZW51IG9wZW5zLlxuICAgICAgICogQGV2ZW50IE9mZkNhbnZhcyNjbG9zZWRcbiAgICAgICAqL1xuICAgICAgICAudHJpZ2dlcignY2xvc2VkLnpmLm9mZmNhbnZhcycpO1xuICAgIC8vIGlmIChfdGhpcy5vcHRpb25zLmlzU3RpY2t5IHx8ICFfdGhpcy5vcHRpb25zLmZvcmNlVG9wKSB7XG4gICAgLy8gICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICBfdGhpcy4kZWxlbWVudFswXS5zdHlsZS50cmFuc2Zvcm0gPSAnJztcbiAgICAvLyAgICAgJCh3aW5kb3cpLm9mZignc2Nyb2xsLnpmLm9mZmNhbnZhcycpO1xuICAgIC8vICAgfSwgdGhpcy5vcHRpb25zLnRyYW5zaXRpb25UaW1lKTtcbiAgICAvLyB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spIHtcbiAgICAgIHRoaXMuJGV4aXRlci5yZW1vdmVDbGFzcygnaXMtdmlzaWJsZScpO1xuICAgIH1cblxuICAgIHRoaXMuJGxhc3RUcmlnZ2VyLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnRyYXBGb2N1cykge1xuICAgICAgJCgnW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XScpLnJlbW92ZUF0dHIoJ3RhYmluZGV4Jyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIG9mZi1jYW52YXMgbWVudSBvcGVuIG9yIGNsb3NlZC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIEV2ZW50IG9iamVjdCBwYXNzZWQgZnJvbSBsaXN0ZW5lci5cbiAgICogQHBhcmFtIHtqUXVlcnl9IHRyaWdnZXIgLSBlbGVtZW50IHRoYXQgdHJpZ2dlcmVkIHRoZSBvZmYtY2FudmFzIHRvIG9wZW4uXG4gICAqL1xuICB0b2dnbGUoZXZlbnQsIHRyaWdnZXIpIHtcbiAgICBpZiAodGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpKSB7XG4gICAgICB0aGlzLmNsb3NlKGV2ZW50LCB0cmlnZ2VyKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLm9wZW4oZXZlbnQsIHRyaWdnZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGtleWJvYXJkIGlucHV0IHdoZW4gZGV0ZWN0ZWQuIFdoZW4gdGhlIGVzY2FwZSBrZXkgaXMgcHJlc3NlZCwgdGhlIG9mZi1jYW52YXMgbWVudSBjbG9zZXMsIGFuZCBmb2N1cyBpcyByZXN0b3JlZCB0byB0aGUgZWxlbWVudCB0aGF0IG9wZW5lZCB0aGUgbWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaGFuZGxlS2V5Ym9hcmQoZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQud2hpY2ggIT09IDI3KSByZXR1cm47XG5cbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgICB0aGlzLiRsYXN0VHJpZ2dlci5mb2N1cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBvZmZjYW52YXMgcGx1Z2luLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5jbG9zZSgpO1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYudHJpZ2dlciAuemYub2ZmY2FudmFzJyk7XG4gICAgdGhpcy4kZXhpdGVyLm9mZignLnpmLm9mZmNhbnZhcycpO1xuXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cbk9mZkNhbnZhcy5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIEFsbG93IHRoZSB1c2VyIHRvIGNsaWNrIG91dHNpZGUgb2YgdGhlIG1lbnUgdG8gY2xvc2UgaXQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuXG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSBpbiBtcyB0aGUgb3BlbiBhbmQgY2xvc2UgdHJhbnNpdGlvbiByZXF1aXJlcy4gSWYgbm9uZSBzZWxlY3RlZCwgcHVsbHMgZnJvbSBib2R5IHN0eWxlLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDUwMFxuICAgKi9cbiAgdHJhbnNpdGlvblRpbWU6IDAsXG5cbiAgLyoqXG4gICAqIERpcmVjdGlvbiB0aGUgb2ZmY2FudmFzIG9wZW5zIGZyb20uIERldGVybWluZXMgY2xhc3MgYXBwbGllZCB0byBib2R5LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGxlZnRcbiAgICovXG4gIHBvc2l0aW9uOiAnbGVmdCcsXG5cbiAgLyoqXG4gICAqIEZvcmNlIHRoZSBwYWdlIHRvIHNjcm9sbCB0byB0b3Agb24gb3Blbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBmb3JjZVRvcDogdHJ1ZSxcblxuICAvKipcbiAgICogQWxsb3cgdGhlIG9mZmNhbnZhcyB0byByZW1haW4gb3BlbiBmb3IgY2VydGFpbiBicmVha3BvaW50cy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgaXNSZXZlYWxlZDogZmFsc2UsXG5cbiAgLyoqXG4gICAqIEJyZWFrcG9pbnQgYXQgd2hpY2ggdG8gcmV2ZWFsLiBKUyB3aWxsIHVzZSBhIFJlZ0V4cCB0byB0YXJnZXQgc3RhbmRhcmQgY2xhc3NlcywgaWYgY2hhbmdpbmcgY2xhc3NuYW1lcywgcGFzcyB5b3VyIGNsYXNzIHdpdGggdGhlIGByZXZlYWxDbGFzc2Agb3B0aW9uLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHJldmVhbC1mb3ItbGFyZ2VcbiAgICovXG4gIHJldmVhbE9uOiBudWxsLFxuXG4gIC8qKlxuICAgKiBGb3JjZSBmb2N1cyB0byB0aGUgb2ZmY2FudmFzIG9uIG9wZW4uIElmIHRydWUsIHdpbGwgZm9jdXMgdGhlIG9wZW5pbmcgdHJpZ2dlciBvbiBjbG9zZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBhdXRvRm9jdXM6IHRydWUsXG5cbiAgLyoqXG4gICAqIENsYXNzIHVzZWQgdG8gZm9yY2UgYW4gb2ZmY2FudmFzIHRvIHJlbWFpbiBvcGVuLiBGb3VuZGF0aW9uIGRlZmF1bHRzIGZvciB0aGlzIGFyZSBgcmV2ZWFsLWZvci1sYXJnZWAgJiBgcmV2ZWFsLWZvci1tZWRpdW1gLlxuICAgKiBAb3B0aW9uXG4gICAqIFRPRE8gaW1wcm92ZSB0aGUgcmVnZXggdGVzdGluZyBmb3IgdGhpcy5cbiAgICogQGV4YW1wbGUgcmV2ZWFsLWZvci1sYXJnZVxuICAgKi9cbiAgcmV2ZWFsQ2xhc3M6ICdyZXZlYWwtZm9yLScsXG5cbiAgLyoqXG4gICAqIFRyaWdnZXJzIG9wdGlvbmFsIGZvY3VzIHRyYXBwaW5nIHdoZW4gb3BlbmluZyBhbiBvZmZjYW52YXMuIFNldHMgdGFiaW5kZXggb2YgW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XSB0byAtMSBmb3IgYWNjZXNzaWJpbGl0eSBwdXJwb3Nlcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICB0cmFwRm9jdXM6IGZhbHNlXG59XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihPZmZDYW52YXMsICdPZmZDYW52YXMnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIE9yYml0IG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5vcmJpdFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb25cbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudGltZXJBbmRJbWFnZUxvYWRlclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50b3VjaFxuICovXG5cbmNsYXNzIE9yYml0IHtcbiAgLyoqXG4gICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhbiBvcmJpdCBjYXJvdXNlbC5cbiAgKiBAY2xhc3NcbiAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGFuIE9yYml0IENhcm91c2VsLlxuICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucyl7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIE9yYml0LmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdPcmJpdCcpO1xuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ09yYml0Jywge1xuICAgICAgJ2x0cic6IHtcbiAgICAgICAgJ0FSUk9XX1JJR0hUJzogJ25leHQnLFxuICAgICAgICAnQVJST1dfTEVGVCc6ICdwcmV2aW91cydcbiAgICAgIH0sXG4gICAgICAncnRsJzoge1xuICAgICAgICAnQVJST1dfTEVGVCc6ICduZXh0JyxcbiAgICAgICAgJ0FSUk9XX1JJR0hUJzogJ3ByZXZpb3VzJ1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICogSW5pdGlhbGl6ZXMgdGhlIHBsdWdpbiBieSBjcmVhdGluZyBqUXVlcnkgY29sbGVjdGlvbnMsIHNldHRpbmcgYXR0cmlidXRlcywgYW5kIHN0YXJ0aW5nIHRoZSBhbmltYXRpb24uXG4gICogQGZ1bmN0aW9uXG4gICogQHByaXZhdGVcbiAgKi9cbiAgX2luaXQoKSB7XG4gICAgdGhpcy4kd3JhcHBlciA9IHRoaXMuJGVsZW1lbnQuZmluZChgLiR7dGhpcy5vcHRpb25zLmNvbnRhaW5lckNsYXNzfWApO1xuICAgIHRoaXMuJHNsaWRlcyA9IHRoaXMuJGVsZW1lbnQuZmluZChgLiR7dGhpcy5vcHRpb25zLnNsaWRlQ2xhc3N9YCk7XG4gICAgdmFyICRpbWFnZXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2ltZycpLFxuICAgIGluaXRBY3RpdmUgPSB0aGlzLiRzbGlkZXMuZmlsdGVyKCcuaXMtYWN0aXZlJyk7XG5cbiAgICBpZiAoIWluaXRBY3RpdmUubGVuZ3RoKSB7XG4gICAgICB0aGlzLiRzbGlkZXMuZXEoMCkuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5vcHRpb25zLnVzZU1VSSkge1xuICAgICAgdGhpcy4kc2xpZGVzLmFkZENsYXNzKCduby1tb3Rpb251aScpO1xuICAgIH1cblxuICAgIGlmICgkaW1hZ2VzLmxlbmd0aCkge1xuICAgICAgRm91bmRhdGlvbi5vbkltYWdlc0xvYWRlZCgkaW1hZ2VzLCB0aGlzLl9wcmVwYXJlRm9yT3JiaXQuYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3ByZXBhcmVGb3JPcmJpdCgpOy8vaGVoZVxuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuYnVsbGV0cykge1xuICAgICAgdGhpcy5fbG9hZEJ1bGxldHMoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9ldmVudHMoKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b1BsYXkgJiYgdGhpcy4kc2xpZGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRoaXMuZ2VvU3luYygpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuYWNjZXNzaWJsZSkgeyAvLyBhbGxvdyB3cmFwcGVyIHRvIGJlIGZvY3VzYWJsZSB0byBlbmFibGUgYXJyb3cgbmF2aWdhdGlvblxuICAgICAgdGhpcy4kd3JhcHBlci5hdHRyKCd0YWJpbmRleCcsIDApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAqIENyZWF0ZXMgYSBqUXVlcnkgY29sbGVjdGlvbiBvZiBidWxsZXRzLCBpZiB0aGV5IGFyZSBiZWluZyB1c2VkLlxuICAqIEBmdW5jdGlvblxuICAqIEBwcml2YXRlXG4gICovXG4gIF9sb2FkQnVsbGV0cygpIHtcbiAgICB0aGlzLiRidWxsZXRzID0gdGhpcy4kZWxlbWVudC5maW5kKGAuJHt0aGlzLm9wdGlvbnMuYm94T2ZCdWxsZXRzfWApLmZpbmQoJ2J1dHRvbicpO1xuICB9XG5cbiAgLyoqXG4gICogU2V0cyBhIGB0aW1lcmAgb2JqZWN0IG9uIHRoZSBvcmJpdCwgYW5kIHN0YXJ0cyB0aGUgY291bnRlciBmb3IgdGhlIG5leHQgc2xpZGUuXG4gICogQGZ1bmN0aW9uXG4gICovXG4gIGdlb1N5bmMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB0aGlzLnRpbWVyID0gbmV3IEZvdW5kYXRpb24uVGltZXIoXG4gICAgICB0aGlzLiRlbGVtZW50LFxuICAgICAge1xuICAgICAgICBkdXJhdGlvbjogdGhpcy5vcHRpb25zLnRpbWVyRGVsYXksXG4gICAgICAgIGluZmluaXRlOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICBfdGhpcy5jaGFuZ2VTbGlkZSh0cnVlKTtcbiAgICAgIH0pO1xuICAgIHRoaXMudGltZXIuc3RhcnQoKTtcbiAgfVxuXG4gIC8qKlxuICAqIFNldHMgd3JhcHBlciBhbmQgc2xpZGUgaGVpZ2h0cyBmb3IgdGhlIG9yYml0LlxuICAqIEBmdW5jdGlvblxuICAqIEBwcml2YXRlXG4gICovXG4gIF9wcmVwYXJlRm9yT3JiaXQoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB0aGlzLl9zZXRXcmFwcGVySGVpZ2h0KGZ1bmN0aW9uKG1heCl7XG4gICAgICBfdGhpcy5fc2V0U2xpZGVIZWlnaHQobWF4KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAqIENhbHVsYXRlcyB0aGUgaGVpZ2h0IG9mIGVhY2ggc2xpZGUgaW4gdGhlIGNvbGxlY3Rpb24sIGFuZCB1c2VzIHRoZSB0YWxsZXN0IG9uZSBmb3IgdGhlIHdyYXBwZXIgaGVpZ2h0LlxuICAqIEBmdW5jdGlvblxuICAqIEBwcml2YXRlXG4gICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGZpcmUgd2hlbiBjb21wbGV0ZS5cbiAgKi9cbiAgX3NldFdyYXBwZXJIZWlnaHQoY2IpIHsvL3Jld3JpdGUgdGhpcyB0byBgZm9yYCBsb29wXG4gICAgdmFyIG1heCA9IDAsIHRlbXAsIGNvdW50ZXIgPSAwO1xuXG4gICAgdGhpcy4kc2xpZGVzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB0ZW1wID0gdGhpcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQ7XG4gICAgICAkKHRoaXMpLmF0dHIoJ2RhdGEtc2xpZGUnLCBjb3VudGVyKTtcblxuICAgICAgaWYgKGNvdW50ZXIpIHsvL2lmIG5vdCB0aGUgZmlyc3Qgc2xpZGUsIHNldCBjc3MgcG9zaXRpb24gYW5kIGRpc3BsYXkgcHJvcGVydHlcbiAgICAgICAgJCh0aGlzKS5jc3Moeydwb3NpdGlvbic6ICdyZWxhdGl2ZScsICdkaXNwbGF5JzogJ25vbmUnfSk7XG4gICAgICB9XG4gICAgICBtYXggPSB0ZW1wID4gbWF4ID8gdGVtcCA6IG1heDtcbiAgICAgIGNvdW50ZXIrKztcbiAgICB9KTtcblxuICAgIGlmIChjb3VudGVyID09PSB0aGlzLiRzbGlkZXMubGVuZ3RoKSB7XG4gICAgICB0aGlzLiR3cmFwcGVyLmNzcyh7J2hlaWdodCc6IG1heH0pOyAvL29ubHkgY2hhbmdlIHRoZSB3cmFwcGVyIGhlaWdodCBwcm9wZXJ0eSBvbmNlLlxuICAgICAgY2IobWF4KTsgLy9maXJlIGNhbGxiYWNrIHdpdGggbWF4IGhlaWdodCBkaW1lbnNpb24uXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICogU2V0cyB0aGUgbWF4LWhlaWdodCBvZiBlYWNoIHNsaWRlLlxuICAqIEBmdW5jdGlvblxuICAqIEBwcml2YXRlXG4gICovXG4gIF9zZXRTbGlkZUhlaWdodChoZWlnaHQpIHtcbiAgICB0aGlzLiRzbGlkZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICQodGhpcykuY3NzKCdtYXgtaGVpZ2h0JywgaGVpZ2h0KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIGJhc2ljYWxseSBldmVyeXRoaW5nIHdpdGhpbiB0aGUgZWxlbWVudC5cbiAgKiBAZnVuY3Rpb25cbiAgKiBAcHJpdmF0ZVxuICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgIC8vKipOb3cgdXNpbmcgY3VzdG9tIGV2ZW50IC0gdGhhbmtzIHRvOioqXG4gICAgLy8qKiAgICAgIFlvaGFpIEFyYXJhdCBvZiBUb3JvbnRvICAgICAgKipcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgIGlmICh0aGlzLiRzbGlkZXMubGVuZ3RoID4gMSkge1xuXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnN3aXBlKSB7XG4gICAgICAgIHRoaXMuJHNsaWRlcy5vZmYoJ3N3aXBlbGVmdC56Zi5vcmJpdCBzd2lwZXJpZ2h0LnpmLm9yYml0JylcbiAgICAgICAgLm9uKCdzd2lwZWxlZnQuemYub3JiaXQnLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgX3RoaXMuY2hhbmdlU2xpZGUodHJ1ZSk7XG4gICAgICAgIH0pLm9uKCdzd2lwZXJpZ2h0LnpmLm9yYml0JywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIF90aGlzLmNoYW5nZVNsaWRlKGZhbHNlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAvLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4gICAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9QbGF5KSB7XG4gICAgICAgIHRoaXMuJHNsaWRlcy5vbignY2xpY2suemYub3JiaXQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy4kZWxlbWVudC5kYXRhKCdjbGlja2VkT24nLCBfdGhpcy4kZWxlbWVudC5kYXRhKCdjbGlja2VkT24nKSA/IGZhbHNlIDogdHJ1ZSk7XG4gICAgICAgICAgX3RoaXMudGltZXJbX3RoaXMuJGVsZW1lbnQuZGF0YSgnY2xpY2tlZE9uJykgPyAncGF1c2UnIDogJ3N0YXJ0J10oKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYXVzZU9uSG92ZXIpIHtcbiAgICAgICAgICB0aGlzLiRlbGVtZW50Lm9uKCdtb3VzZWVudGVyLnpmLm9yYml0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBfdGhpcy50aW1lci5wYXVzZSgpO1xuICAgICAgICAgIH0pLm9uKCdtb3VzZWxlYXZlLnpmLm9yYml0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIV90aGlzLiRlbGVtZW50LmRhdGEoJ2NsaWNrZWRPbicpKSB7XG4gICAgICAgICAgICAgIF90aGlzLnRpbWVyLnN0YXJ0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5uYXZCdXR0b25zKSB7XG4gICAgICAgIHZhciAkY29udHJvbHMgPSB0aGlzLiRlbGVtZW50LmZpbmQoYC4ke3RoaXMub3B0aW9ucy5uZXh0Q2xhc3N9LCAuJHt0aGlzLm9wdGlvbnMucHJldkNsYXNzfWApO1xuICAgICAgICAkY29udHJvbHMuYXR0cigndGFiaW5kZXgnLCAwKVxuICAgICAgICAvL2Fsc28gbmVlZCB0byBoYW5kbGUgZW50ZXIvcmV0dXJuIGFuZCBzcGFjZWJhciBrZXkgcHJlc3Nlc1xuICAgICAgICAub24oJ2NsaWNrLnpmLm9yYml0IHRvdWNoZW5kLnpmLm9yYml0JywgZnVuY3Rpb24oZSl7XG5cdCAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIF90aGlzLmNoYW5nZVNsaWRlKCQodGhpcykuaGFzQ2xhc3MoX3RoaXMub3B0aW9ucy5uZXh0Q2xhc3MpKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuYnVsbGV0cykge1xuICAgICAgICB0aGlzLiRidWxsZXRzLm9uKCdjbGljay56Zi5vcmJpdCB0b3VjaGVuZC56Zi5vcmJpdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICgvaXMtYWN0aXZlL2cudGVzdCh0aGlzLmNsYXNzTmFtZSkpIHsgcmV0dXJuIGZhbHNlOyB9Ly9pZiB0aGlzIGlzIGFjdGl2ZSwga2ljayBvdXQgb2YgZnVuY3Rpb24uXG4gICAgICAgICAgdmFyIGlkeCA9ICQodGhpcykuZGF0YSgnc2xpZGUnKSxcbiAgICAgICAgICBsdHIgPSBpZHggPiBfdGhpcy4kc2xpZGVzLmZpbHRlcignLmlzLWFjdGl2ZScpLmRhdGEoJ3NsaWRlJyksXG4gICAgICAgICAgJHNsaWRlID0gX3RoaXMuJHNsaWRlcy5lcShpZHgpO1xuXG4gICAgICAgICAgX3RoaXMuY2hhbmdlU2xpZGUobHRyLCAkc2xpZGUsIGlkeCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLiR3cmFwcGVyLmFkZCh0aGlzLiRidWxsZXRzKS5vbigna2V5ZG93bi56Zi5vcmJpdCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gaGFuZGxlIGtleWJvYXJkIGV2ZW50IHdpdGgga2V5Ym9hcmQgdXRpbFxuICAgICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnT3JiaXQnLCB7XG4gICAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBfdGhpcy5jaGFuZ2VTbGlkZSh0cnVlKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHByZXZpb3VzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIF90aGlzLmNoYW5nZVNsaWRlKGZhbHNlKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGhhbmRsZWQ6IGZ1bmN0aW9uKCkgeyAvLyBpZiBidWxsZXQgaXMgZm9jdXNlZCwgbWFrZSBzdXJlIGZvY3VzIG1vdmVzXG4gICAgICAgICAgICBpZiAoJChlLnRhcmdldCkuaXMoX3RoaXMuJGJ1bGxldHMpKSB7XG4gICAgICAgICAgICAgIF90aGlzLiRidWxsZXRzLmZpbHRlcignLmlzLWFjdGl2ZScpLmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAqIENoYW5nZXMgdGhlIGN1cnJlbnQgc2xpZGUgdG8gYSBuZXcgb25lLlxuICAqIEBmdW5jdGlvblxuICAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNMVFIgLSBmbGFnIGlmIHRoZSBzbGlkZSBzaG91bGQgbW92ZSBsZWZ0IHRvIHJpZ2h0LlxuICAqIEBwYXJhbSB7alF1ZXJ5fSBjaG9zZW5TbGlkZSAtIHRoZSBqUXVlcnkgZWxlbWVudCBvZiB0aGUgc2xpZGUgdG8gc2hvdyBuZXh0LCBpZiBvbmUgaXMgc2VsZWN0ZWQuXG4gICogQHBhcmFtIHtOdW1iZXJ9IGlkeCAtIHRoZSBpbmRleCBvZiB0aGUgbmV3IHNsaWRlIGluIGl0cyBjb2xsZWN0aW9uLCBpZiBvbmUgY2hvc2VuLlxuICAqIEBmaXJlcyBPcmJpdCNzbGlkZWNoYW5nZVxuICAqL1xuICBjaGFuZ2VTbGlkZShpc0xUUiwgY2hvc2VuU2xpZGUsIGlkeCkge1xuICAgIHZhciAkY3VyU2xpZGUgPSB0aGlzLiRzbGlkZXMuZmlsdGVyKCcuaXMtYWN0aXZlJykuZXEoMCk7XG5cbiAgICBpZiAoL211aS9nLnRlc3QoJGN1clNsaWRlWzBdLmNsYXNzTmFtZSkpIHsgcmV0dXJuIGZhbHNlOyB9IC8vaWYgdGhlIHNsaWRlIGlzIGN1cnJlbnRseSBhbmltYXRpbmcsIGtpY2sgb3V0IG9mIHRoZSBmdW5jdGlvblxuXG4gICAgdmFyICRmaXJzdFNsaWRlID0gdGhpcy4kc2xpZGVzLmZpcnN0KCksXG4gICAgJGxhc3RTbGlkZSA9IHRoaXMuJHNsaWRlcy5sYXN0KCksXG4gICAgZGlySW4gPSBpc0xUUiA/ICdSaWdodCcgOiAnTGVmdCcsXG4gICAgZGlyT3V0ID0gaXNMVFIgPyAnTGVmdCcgOiAnUmlnaHQnLFxuICAgIF90aGlzID0gdGhpcyxcbiAgICAkbmV3U2xpZGU7XG5cbiAgICBpZiAoIWNob3NlblNsaWRlKSB7IC8vbW9zdCBvZiB0aGUgdGltZSwgdGhpcyB3aWxsIGJlIGF1dG8gcGxheWVkIG9yIGNsaWNrZWQgZnJvbSB0aGUgbmF2QnV0dG9ucy5cbiAgICAgICRuZXdTbGlkZSA9IGlzTFRSID8gLy9pZiB3cmFwcGluZyBlbmFibGVkLCBjaGVjayB0byBzZWUgaWYgdGhlcmUgaXMgYSBgbmV4dGAgb3IgYHByZXZgIHNpYmxpbmcsIGlmIG5vdCwgc2VsZWN0IHRoZSBmaXJzdCBvciBsYXN0IHNsaWRlIHRvIGZpbGwgaW4uIGlmIHdyYXBwaW5nIG5vdCBlbmFibGVkLCBhdHRlbXB0IHRvIHNlbGVjdCBgbmV4dGAgb3IgYHByZXZgLCBpZiB0aGVyZSdzIG5vdGhpbmcgdGhlcmUsIHRoZSBmdW5jdGlvbiB3aWxsIGtpY2sgb3V0IG9uIG5leHQgc3RlcC4gQ1JBWlkgTkVTVEVEIFRFUk5BUklFUyEhISEhXG4gICAgICAodGhpcy5vcHRpb25zLmluZmluaXRlV3JhcCA/ICRjdXJTbGlkZS5uZXh0KGAuJHt0aGlzLm9wdGlvbnMuc2xpZGVDbGFzc31gKS5sZW5ndGggPyAkY3VyU2xpZGUubmV4dChgLiR7dGhpcy5vcHRpb25zLnNsaWRlQ2xhc3N9YCkgOiAkZmlyc3RTbGlkZSA6ICRjdXJTbGlkZS5uZXh0KGAuJHt0aGlzLm9wdGlvbnMuc2xpZGVDbGFzc31gKSkvL3BpY2sgbmV4dCBzbGlkZSBpZiBtb3ZpbmcgbGVmdCB0byByaWdodFxuICAgICAgOlxuICAgICAgKHRoaXMub3B0aW9ucy5pbmZpbml0ZVdyYXAgPyAkY3VyU2xpZGUucHJldihgLiR7dGhpcy5vcHRpb25zLnNsaWRlQ2xhc3N9YCkubGVuZ3RoID8gJGN1clNsaWRlLnByZXYoYC4ke3RoaXMub3B0aW9ucy5zbGlkZUNsYXNzfWApIDogJGxhc3RTbGlkZSA6ICRjdXJTbGlkZS5wcmV2KGAuJHt0aGlzLm9wdGlvbnMuc2xpZGVDbGFzc31gKSk7Ly9waWNrIHByZXYgc2xpZGUgaWYgbW92aW5nIHJpZ2h0IHRvIGxlZnRcbiAgICB9IGVsc2Uge1xuICAgICAgJG5ld1NsaWRlID0gY2hvc2VuU2xpZGU7XG4gICAgfVxuXG4gICAgaWYgKCRuZXdTbGlkZS5sZW5ndGgpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuYnVsbGV0cykge1xuICAgICAgICBpZHggPSBpZHggfHwgdGhpcy4kc2xpZGVzLmluZGV4KCRuZXdTbGlkZSk7IC8vZ3JhYiBpbmRleCB0byB1cGRhdGUgYnVsbGV0c1xuICAgICAgICB0aGlzLl91cGRhdGVCdWxsZXRzKGlkeCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMudXNlTVVJKSB7XG4gICAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVJbihcbiAgICAgICAgICAkbmV3U2xpZGUuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpLmNzcyh7J3Bvc2l0aW9uJzogJ2Fic29sdXRlJywgJ3RvcCc6IDB9KSxcbiAgICAgICAgICB0aGlzLm9wdGlvbnNbYGFuaW1JbkZyb20ke2RpcklufWBdLFxuICAgICAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAkbmV3U2xpZGUuY3NzKHsncG9zaXRpb24nOiAncmVsYXRpdmUnLCAnZGlzcGxheSc6ICdibG9jayd9KVxuICAgICAgICAgICAgLmF0dHIoJ2FyaWEtbGl2ZScsICdwb2xpdGUnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dChcbiAgICAgICAgICAkY3VyU2xpZGUucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpLFxuICAgICAgICAgIHRoaXMub3B0aW9uc1tgYW5pbU91dFRvJHtkaXJPdXR9YF0sXG4gICAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICRjdXJTbGlkZS5yZW1vdmVBdHRyKCdhcmlhLWxpdmUnKTtcbiAgICAgICAgICAgIGlmKF90aGlzLm9wdGlvbnMuYXV0b1BsYXkgJiYgIV90aGlzLnRpbWVyLmlzUGF1c2VkKXtcbiAgICAgICAgICAgICAgX3RoaXMudGltZXIucmVzdGFydCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy9kbyBzdHVmZj9cbiAgICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRjdXJTbGlkZS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlIGlzLWluJykucmVtb3ZlQXR0cignYXJpYS1saXZlJykuaGlkZSgpO1xuICAgICAgICAkbmV3U2xpZGUuYWRkQ2xhc3MoJ2lzLWFjdGl2ZSBpcy1pbicpLmF0dHIoJ2FyaWEtbGl2ZScsICdwb2xpdGUnKS5zaG93KCk7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b1BsYXkgJiYgIXRoaXMudGltZXIuaXNQYXVzZWQpIHtcbiAgICAgICAgICB0aGlzLnRpbWVyLnJlc3RhcnQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIC8qKlxuICAgICogVHJpZ2dlcnMgd2hlbiB0aGUgc2xpZGUgaGFzIGZpbmlzaGVkIGFuaW1hdGluZyBpbi5cbiAgICAqIEBldmVudCBPcmJpdCNzbGlkZWNoYW5nZVxuICAgICovXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3NsaWRlY2hhbmdlLnpmLm9yYml0JywgWyRuZXdTbGlkZV0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAqIFVwZGF0ZXMgdGhlIGFjdGl2ZSBzdGF0ZSBvZiB0aGUgYnVsbGV0cywgaWYgZGlzcGxheWVkLlxuICAqIEBmdW5jdGlvblxuICAqIEBwcml2YXRlXG4gICogQHBhcmFtIHtOdW1iZXJ9IGlkeCAtIHRoZSBpbmRleCBvZiB0aGUgY3VycmVudCBzbGlkZS5cbiAgKi9cbiAgX3VwZGF0ZUJ1bGxldHMoaWR4KSB7XG4gICAgdmFyICRvbGRCdWxsZXQgPSB0aGlzLiRlbGVtZW50LmZpbmQoYC4ke3RoaXMub3B0aW9ucy5ib3hPZkJ1bGxldHN9YClcbiAgICAuZmluZCgnLmlzLWFjdGl2ZScpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKS5ibHVyKCksXG4gICAgc3BhbiA9ICRvbGRCdWxsZXQuZmluZCgnc3BhbjpsYXN0JykuZGV0YWNoKCksXG4gICAgJG5ld0J1bGxldCA9IHRoaXMuJGJ1bGxldHMuZXEoaWR4KS5hZGRDbGFzcygnaXMtYWN0aXZlJykuYXBwZW5kKHNwYW4pO1xuICB9XG5cbiAgLyoqXG4gICogRGVzdHJveXMgdGhlIGNhcm91c2VsIGFuZCBoaWRlcyB0aGUgZWxlbWVudC5cbiAgKiBAZnVuY3Rpb25cbiAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLm9yYml0JykuZmluZCgnKicpLm9mZignLnpmLm9yYml0JykuZW5kKCkuaGlkZSgpO1xuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG5PcmJpdC5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICogVGVsbHMgdGhlIEpTIHRvIGxvb2sgZm9yIGFuZCBsb2FkQnVsbGV0cy5cbiAgKiBAb3B0aW9uXG4gICogQGV4YW1wbGUgdHJ1ZVxuICAqL1xuICBidWxsZXRzOiB0cnVlLFxuICAvKipcbiAgKiBUZWxscyB0aGUgSlMgdG8gYXBwbHkgZXZlbnQgbGlzdGVuZXJzIHRvIG5hdiBidXR0b25zXG4gICogQG9wdGlvblxuICAqIEBleGFtcGxlIHRydWVcbiAgKi9cbiAgbmF2QnV0dG9uczogdHJ1ZSxcbiAgLyoqXG4gICogbW90aW9uLXVpIGFuaW1hdGlvbiBjbGFzcyB0byBhcHBseVxuICAqIEBvcHRpb25cbiAgKiBAZXhhbXBsZSAnc2xpZGUtaW4tcmlnaHQnXG4gICovXG4gIGFuaW1JbkZyb21SaWdodDogJ3NsaWRlLWluLXJpZ2h0JyxcbiAgLyoqXG4gICogbW90aW9uLXVpIGFuaW1hdGlvbiBjbGFzcyB0byBhcHBseVxuICAqIEBvcHRpb25cbiAgKiBAZXhhbXBsZSAnc2xpZGUtb3V0LXJpZ2h0J1xuICAqL1xuICBhbmltT3V0VG9SaWdodDogJ3NsaWRlLW91dC1yaWdodCcsXG4gIC8qKlxuICAqIG1vdGlvbi11aSBhbmltYXRpb24gY2xhc3MgdG8gYXBwbHlcbiAgKiBAb3B0aW9uXG4gICogQGV4YW1wbGUgJ3NsaWRlLWluLWxlZnQnXG4gICpcbiAgKi9cbiAgYW5pbUluRnJvbUxlZnQ6ICdzbGlkZS1pbi1sZWZ0JyxcbiAgLyoqXG4gICogbW90aW9uLXVpIGFuaW1hdGlvbiBjbGFzcyB0byBhcHBseVxuICAqIEBvcHRpb25cbiAgKiBAZXhhbXBsZSAnc2xpZGUtb3V0LWxlZnQnXG4gICovXG4gIGFuaW1PdXRUb0xlZnQ6ICdzbGlkZS1vdXQtbGVmdCcsXG4gIC8qKlxuICAqIEFsbG93cyBPcmJpdCB0byBhdXRvbWF0aWNhbGx5IGFuaW1hdGUgb24gcGFnZSBsb2FkLlxuICAqIEBvcHRpb25cbiAgKiBAZXhhbXBsZSB0cnVlXG4gICovXG4gIGF1dG9QbGF5OiB0cnVlLFxuICAvKipcbiAgKiBBbW91bnQgb2YgdGltZSwgaW4gbXMsIGJldHdlZW4gc2xpZGUgdHJhbnNpdGlvbnNcbiAgKiBAb3B0aW9uXG4gICogQGV4YW1wbGUgNTAwMFxuICAqL1xuICB0aW1lckRlbGF5OiA1MDAwLFxuICAvKipcbiAgKiBBbGxvd3MgT3JiaXQgdG8gaW5maW5pdGVseSBsb29wIHRocm91Z2ggdGhlIHNsaWRlc1xuICAqIEBvcHRpb25cbiAgKiBAZXhhbXBsZSB0cnVlXG4gICovXG4gIGluZmluaXRlV3JhcDogdHJ1ZSxcbiAgLyoqXG4gICogQWxsb3dzIHRoZSBPcmJpdCBzbGlkZXMgdG8gYmluZCB0byBzd2lwZSBldmVudHMgZm9yIG1vYmlsZSwgcmVxdWlyZXMgYW4gYWRkaXRpb25hbCB1dGlsIGxpYnJhcnlcbiAgKiBAb3B0aW9uXG4gICogQGV4YW1wbGUgdHJ1ZVxuICAqL1xuICBzd2lwZTogdHJ1ZSxcbiAgLyoqXG4gICogQWxsb3dzIHRoZSB0aW1pbmcgZnVuY3Rpb24gdG8gcGF1c2UgYW5pbWF0aW9uIG9uIGhvdmVyLlxuICAqIEBvcHRpb25cbiAgKiBAZXhhbXBsZSB0cnVlXG4gICovXG4gIHBhdXNlT25Ib3ZlcjogdHJ1ZSxcbiAgLyoqXG4gICogQWxsb3dzIE9yYml0IHRvIGJpbmQga2V5Ym9hcmQgZXZlbnRzIHRvIHRoZSBzbGlkZXIsIHRvIGFuaW1hdGUgZnJhbWVzIHdpdGggYXJyb3cga2V5c1xuICAqIEBvcHRpb25cbiAgKiBAZXhhbXBsZSB0cnVlXG4gICovXG4gIGFjY2Vzc2libGU6IHRydWUsXG4gIC8qKlxuICAqIENsYXNzIGFwcGxpZWQgdG8gdGhlIGNvbnRhaW5lciBvZiBPcmJpdFxuICAqIEBvcHRpb25cbiAgKiBAZXhhbXBsZSAnb3JiaXQtY29udGFpbmVyJ1xuICAqL1xuICBjb250YWluZXJDbGFzczogJ29yYml0LWNvbnRhaW5lcicsXG4gIC8qKlxuICAqIENsYXNzIGFwcGxpZWQgdG8gaW5kaXZpZHVhbCBzbGlkZXMuXG4gICogQG9wdGlvblxuICAqIEBleGFtcGxlICdvcmJpdC1zbGlkZSdcbiAgKi9cbiAgc2xpZGVDbGFzczogJ29yYml0LXNsaWRlJyxcbiAgLyoqXG4gICogQ2xhc3MgYXBwbGllZCB0byB0aGUgYnVsbGV0IGNvbnRhaW5lci4gWW91J3JlIHdlbGNvbWUuXG4gICogQG9wdGlvblxuICAqIEBleGFtcGxlICdvcmJpdC1idWxsZXRzJ1xuICAqL1xuICBib3hPZkJ1bGxldHM6ICdvcmJpdC1idWxsZXRzJyxcbiAgLyoqXG4gICogQ2xhc3MgYXBwbGllZCB0byB0aGUgYG5leHRgIG5hdmlnYXRpb24gYnV0dG9uLlxuICAqIEBvcHRpb25cbiAgKiBAZXhhbXBsZSAnb3JiaXQtbmV4dCdcbiAgKi9cbiAgbmV4dENsYXNzOiAnb3JiaXQtbmV4dCcsXG4gIC8qKlxuICAqIENsYXNzIGFwcGxpZWQgdG8gdGhlIGBwcmV2aW91c2AgbmF2aWdhdGlvbiBidXR0b24uXG4gICogQG9wdGlvblxuICAqIEBleGFtcGxlICdvcmJpdC1wcmV2aW91cydcbiAgKi9cbiAgcHJldkNsYXNzOiAnb3JiaXQtcHJldmlvdXMnLFxuICAvKipcbiAgKiBCb29sZWFuIHRvIGZsYWcgdGhlIGpzIHRvIHVzZSBtb3Rpb24gdWkgY2xhc3NlcyBvciBub3QuIERlZmF1bHQgdG8gdHJ1ZSBmb3IgYmFja3dhcmRzIGNvbXBhdGFiaWxpdHkuXG4gICogQG9wdGlvblxuICAqIEBleGFtcGxlIHRydWVcbiAgKi9cbiAgdXNlTVVJOiB0cnVlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oT3JiaXQsICdPcmJpdCcpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogUmVzcG9uc2l2ZU1lbnUgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnJlc3BvbnNpdmVNZW51XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuYWNjb3JkaW9uTWVudVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5kcmlsbGRvd25cbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuZHJvcGRvd24tbWVudVxuICovXG5cbmNsYXNzIFJlc3BvbnNpdmVNZW51IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSByZXNwb25zaXZlIG1lbnUuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgUmVzcG9uc2l2ZU1lbnUjaW5pdFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGEgZHJvcGRvd24gbWVudS5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuICAgIHRoaXMucnVsZXMgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ3Jlc3BvbnNpdmUtbWVudScpO1xuICAgIHRoaXMuY3VycmVudE1xID0gbnVsbDtcbiAgICB0aGlzLmN1cnJlbnRQbHVnaW4gPSBudWxsO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuICAgIHRoaXMuX2V2ZW50cygpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnUmVzcG9uc2l2ZU1lbnUnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgTWVudSBieSBwYXJzaW5nIHRoZSBjbGFzc2VzIGZyb20gdGhlICdkYXRhLVJlc3BvbnNpdmVNZW51JyBhdHRyaWJ1dGUgb24gdGhlIGVsZW1lbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgLy8gVGhlIGZpcnN0IHRpbWUgYW4gSW50ZXJjaGFuZ2UgcGx1Z2luIGlzIGluaXRpYWxpemVkLCB0aGlzLnJ1bGVzIGlzIGNvbnZlcnRlZCBmcm9tIGEgc3RyaW5nIG9mIFwiY2xhc3Nlc1wiIHRvIGFuIG9iamVjdCBvZiBydWxlc1xuICAgIGlmICh0eXBlb2YgdGhpcy5ydWxlcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGxldCBydWxlc1RyZWUgPSB7fTtcblxuICAgICAgLy8gUGFyc2UgcnVsZXMgZnJvbSBcImNsYXNzZXNcIiBwdWxsZWQgZnJvbSBkYXRhIGF0dHJpYnV0ZVxuICAgICAgbGV0IHJ1bGVzID0gdGhpcy5ydWxlcy5zcGxpdCgnICcpO1xuXG4gICAgICAvLyBJdGVyYXRlIHRocm91Z2ggZXZlcnkgcnVsZSBmb3VuZFxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBydWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgcnVsZSA9IHJ1bGVzW2ldLnNwbGl0KCctJyk7XG4gICAgICAgIGxldCBydWxlU2l6ZSA9IHJ1bGUubGVuZ3RoID4gMSA/IHJ1bGVbMF0gOiAnc21hbGwnO1xuICAgICAgICBsZXQgcnVsZVBsdWdpbiA9IHJ1bGUubGVuZ3RoID4gMSA/IHJ1bGVbMV0gOiBydWxlWzBdO1xuXG4gICAgICAgIGlmIChNZW51UGx1Z2luc1tydWxlUGx1Z2luXSAhPT0gbnVsbCkge1xuICAgICAgICAgIHJ1bGVzVHJlZVtydWxlU2l6ZV0gPSBNZW51UGx1Z2luc1tydWxlUGx1Z2luXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLnJ1bGVzID0gcnVsZXNUcmVlO1xuICAgIH1cblxuICAgIGlmICghJC5pc0VtcHR5T2JqZWN0KHRoaXMucnVsZXMpKSB7XG4gICAgICB0aGlzLl9jaGVja01lZGlhUXVlcmllcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBldmVudHMgZm9yIHRoZSBNZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICQod2luZG93KS5vbignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5fY2hlY2tNZWRpYVF1ZXJpZXMoKTtcbiAgICB9KTtcbiAgICAvLyAkKHdpbmRvdykub24oJ3Jlc2l6ZS56Zi5SZXNwb25zaXZlTWVudScsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgX3RoaXMuX2NoZWNrTWVkaWFRdWVyaWVzKCk7XG4gICAgLy8gfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSBjdXJyZW50IHNjcmVlbiB3aWR0aCBhZ2FpbnN0IGF2YWlsYWJsZSBtZWRpYSBxdWVyaWVzLiBJZiB0aGUgbWVkaWEgcXVlcnkgaGFzIGNoYW5nZWQsIGFuZCB0aGUgcGx1Z2luIG5lZWRlZCBoYXMgY2hhbmdlZCwgdGhlIHBsdWdpbnMgd2lsbCBzd2FwIG91dC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfY2hlY2tNZWRpYVF1ZXJpZXMoKSB7XG4gICAgdmFyIG1hdGNoZWRNcSwgX3RoaXMgPSB0aGlzO1xuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHJ1bGUgYW5kIGZpbmQgdGhlIGxhc3QgbWF0Y2hpbmcgcnVsZVxuICAgICQuZWFjaCh0aGlzLnJ1bGVzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdChrZXkpKSB7XG4gICAgICAgIG1hdGNoZWRNcSA9IGtleTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIE5vIG1hdGNoPyBObyBkaWNlXG4gICAgaWYgKCFtYXRjaGVkTXEpIHJldHVybjtcblxuICAgIC8vIFBsdWdpbiBhbHJlYWR5IGluaXRpYWxpemVkPyBXZSBnb29kXG4gICAgaWYgKHRoaXMuY3VycmVudFBsdWdpbiBpbnN0YW5jZW9mIHRoaXMucnVsZXNbbWF0Y2hlZE1xXS5wbHVnaW4pIHJldHVybjtcblxuICAgIC8vIFJlbW92ZSBleGlzdGluZyBwbHVnaW4tc3BlY2lmaWMgQ1NTIGNsYXNzZXNcbiAgICAkLmVhY2goTWVudVBsdWdpbnMsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgIF90aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHZhbHVlLmNzc0NsYXNzKTtcbiAgICB9KTtcblxuICAgIC8vIEFkZCB0aGUgQ1NTIGNsYXNzIGZvciB0aGUgbmV3IHBsdWdpblxuICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3ModGhpcy5ydWxlc1ttYXRjaGVkTXFdLmNzc0NsYXNzKTtcblxuICAgIC8vIENyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGUgbmV3IHBsdWdpblxuICAgIGlmICh0aGlzLmN1cnJlbnRQbHVnaW4pIHRoaXMuY3VycmVudFBsdWdpbi5kZXN0cm95KCk7XG4gICAgdGhpcy5jdXJyZW50UGx1Z2luID0gbmV3IHRoaXMucnVsZXNbbWF0Y2hlZE1xXS5wbHVnaW4odGhpcy4kZWxlbWVudCwge30pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBpbnN0YW5jZSBvZiB0aGUgY3VycmVudCBwbHVnaW4gb24gdGhpcyBlbGVtZW50LCBhcyB3ZWxsIGFzIHRoZSB3aW5kb3cgcmVzaXplIGhhbmRsZXIgdGhhdCBzd2l0Y2hlcyB0aGUgcGx1Z2lucyBvdXQuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmN1cnJlbnRQbHVnaW4uZGVzdHJveSgpO1xuICAgICQod2luZG93KS5vZmYoJy56Zi5SZXNwb25zaXZlTWVudScpO1xuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG5SZXNwb25zaXZlTWVudS5kZWZhdWx0cyA9IHt9O1xuXG4vLyBUaGUgcGx1Z2luIG1hdGNoZXMgdGhlIHBsdWdpbiBjbGFzc2VzIHdpdGggdGhlc2UgcGx1Z2luIGluc3RhbmNlcy5cbnZhciBNZW51UGx1Z2lucyA9IHtcbiAgZHJvcGRvd246IHtcbiAgICBjc3NDbGFzczogJ2Ryb3Bkb3duJyxcbiAgICBwbHVnaW46IEZvdW5kYXRpb24uX3BsdWdpbnNbJ2Ryb3Bkb3duLW1lbnUnXSB8fCBudWxsXG4gIH0sXG4gZHJpbGxkb3duOiB7XG4gICAgY3NzQ2xhc3M6ICdkcmlsbGRvd24nLFxuICAgIHBsdWdpbjogRm91bmRhdGlvbi5fcGx1Z2luc1snZHJpbGxkb3duJ10gfHwgbnVsbFxuICB9LFxuICBhY2NvcmRpb246IHtcbiAgICBjc3NDbGFzczogJ2FjY29yZGlvbi1tZW51JyxcbiAgICBwbHVnaW46IEZvdW5kYXRpb24uX3BsdWdpbnNbJ2FjY29yZGlvbi1tZW51J10gfHwgbnVsbFxuICB9XG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oUmVzcG9uc2l2ZU1lbnUsICdSZXNwb25zaXZlTWVudScpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogUmVzcG9uc2l2ZVRvZ2dsZSBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ucmVzcG9uc2l2ZVRvZ2dsZVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XG4gKi9cblxuY2xhc3MgUmVzcG9uc2l2ZVRvZ2dsZSB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIFRhYiBCYXIuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgUmVzcG9uc2l2ZVRvZ2dsZSNpbml0XG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhdHRhY2ggdGFiIGJhciBmdW5jdGlvbmFsaXR5IHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIFJlc3BvbnNpdmVUb2dnbGUuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLl9ldmVudHMoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1Jlc3BvbnNpdmVUb2dnbGUnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgdGFiIGJhciBieSBmaW5kaW5nIHRoZSB0YXJnZXQgZWxlbWVudCwgdG9nZ2xpbmcgZWxlbWVudCwgYW5kIHJ1bm5pbmcgdXBkYXRlKCkuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIHRhcmdldElEID0gdGhpcy4kZWxlbWVudC5kYXRhKCdyZXNwb25zaXZlLXRvZ2dsZScpO1xuICAgIGlmICghdGFyZ2V0SUQpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1lvdXIgdGFiIGJhciBuZWVkcyBhbiBJRCBvZiBhIE1lbnUgYXMgdGhlIHZhbHVlIG9mIGRhdGEtdGFiLWJhci4nKTtcbiAgICB9XG5cbiAgICB0aGlzLiR0YXJnZXRNZW51ID0gJChgIyR7dGFyZ2V0SUR9YCk7XG4gICAgdGhpcy4kdG9nZ2xlciA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtdG9nZ2xlXScpO1xuXG4gICAgdGhpcy5fdXBkYXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBuZWNlc3NhcnkgZXZlbnQgaGFuZGxlcnMgZm9yIHRoZSB0YWIgYmFyIHRvIHdvcmsuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCB0aGlzLl91cGRhdGUuYmluZCh0aGlzKSk7XG5cbiAgICB0aGlzLiR0b2dnbGVyLm9uKCdjbGljay56Zi5yZXNwb25zaXZlVG9nZ2xlJywgdGhpcy50b2dnbGVNZW51LmJpbmQodGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB0aGUgY3VycmVudCBtZWRpYSBxdWVyeSB0byBkZXRlcm1pbmUgaWYgdGhlIHRhYiBiYXIgc2hvdWxkIGJlIHZpc2libGUgb3IgaGlkZGVuLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF91cGRhdGUoKSB7XG4gICAgLy8gTW9iaWxlXG4gICAgaWYgKCFGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdCh0aGlzLm9wdGlvbnMuaGlkZUZvcikpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuc2hvdygpO1xuICAgICAgdGhpcy4kdGFyZ2V0TWVudS5oaWRlKCk7XG4gICAgfVxuXG4gICAgLy8gRGVza3RvcFxuICAgIGVsc2Uge1xuICAgICAgdGhpcy4kZWxlbWVudC5oaWRlKCk7XG4gICAgICB0aGlzLiR0YXJnZXRNZW51LnNob3coKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlcyB0aGUgZWxlbWVudCBhdHRhY2hlZCB0byB0aGUgdGFiIGJhci4gVGhlIHRvZ2dsZSBvbmx5IGhhcHBlbnMgaWYgdGhlIHNjcmVlbiBpcyBzbWFsbCBlbm91Z2ggdG8gYWxsb3cgaXQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAZmlyZXMgUmVzcG9uc2l2ZVRvZ2dsZSN0b2dnbGVkXG4gICAqL1xuICB0b2dnbGVNZW51KCkge1xuICAgIGlmICghRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QodGhpcy5vcHRpb25zLmhpZGVGb3IpKSB7XG4gICAgICB0aGlzLiR0YXJnZXRNZW51LnRvZ2dsZSgwKTtcblxuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyB3aGVuIHRoZSBlbGVtZW50IGF0dGFjaGVkIHRvIHRoZSB0YWIgYmFyIHRvZ2dsZXMuXG4gICAgICAgKiBAZXZlbnQgUmVzcG9uc2l2ZVRvZ2dsZSN0b2dnbGVkXG4gICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigndG9nZ2xlZC56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XG4gICAgfVxuICB9O1xuXG4gIGRlc3Ryb3koKSB7XG4gICAgLy9UT0RPIHRoaXMuLi5cbiAgfVxufVxuXG5SZXNwb25zaXZlVG9nZ2xlLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogVGhlIGJyZWFrcG9pbnQgYWZ0ZXIgd2hpY2ggdGhlIG1lbnUgaXMgYWx3YXlzIHNob3duLCBhbmQgdGhlIHRhYiBiYXIgaXMgaGlkZGVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdtZWRpdW0nXG4gICAqL1xuICBoaWRlRm9yOiAnbWVkaXVtJ1xufTtcblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKFJlc3BvbnNpdmVUb2dnbGUsICdSZXNwb25zaXZlVG9nZ2xlJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBSZXZlYWwgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnJldmVhbFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5ib3hcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb24gaWYgdXNpbmcgYW5pbWF0aW9uc1xuICovXG5cbmNsYXNzIFJldmVhbCB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIFJldmVhbC5cbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byB1c2UgZm9yIHRoZSBtb2RhbC5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBvcHRpb25hbCBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBSZXZlYWwuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdSZXZlYWwnKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdSZXZlYWwnLCB7XG4gICAgICAnRU5URVInOiAnb3BlbicsXG4gICAgICAnU1BBQ0UnOiAnb3BlbicsXG4gICAgICAnRVNDQVBFJzogJ2Nsb3NlJyxcbiAgICAgICdUQUInOiAndGFiX2ZvcndhcmQnLFxuICAgICAgJ1NISUZUX1RBQic6ICd0YWJfYmFja3dhcmQnXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIG1vZGFsIGJ5IGFkZGluZyB0aGUgb3ZlcmxheSBhbmQgY2xvc2UgYnV0dG9ucywgKGlmIHNlbGVjdGVkKS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHRoaXMuaWQgPSB0aGlzLiRlbGVtZW50LmF0dHIoJ2lkJyk7XG4gICAgdGhpcy5pc0FjdGl2ZSA9IGZhbHNlO1xuICAgIHRoaXMuY2FjaGVkID0ge21xOiBGb3VuZGF0aW9uLk1lZGlhUXVlcnkuY3VycmVudH07XG4gICAgdGhpcy5pc2lPUyA9IGlQaG9uZVNuaWZmKCk7XG5cbiAgICBpZih0aGlzLmlzaU9TKXsgdGhpcy4kZWxlbWVudC5hZGRDbGFzcygnaXMtaW9zJyk7IH1cblxuICAgIHRoaXMuJGFuY2hvciA9ICQoYFtkYXRhLW9wZW49XCIke3RoaXMuaWR9XCJdYCkubGVuZ3RoID8gJChgW2RhdGEtb3Blbj1cIiR7dGhpcy5pZH1cIl1gKSA6ICQoYFtkYXRhLXRvZ2dsZT1cIiR7dGhpcy5pZH1cIl1gKTtcblxuICAgIGlmICh0aGlzLiRhbmNob3IubGVuZ3RoKSB7XG4gICAgICB2YXIgYW5jaG9ySWQgPSB0aGlzLiRhbmNob3JbMF0uaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAncmV2ZWFsJyk7XG5cbiAgICAgIHRoaXMuJGFuY2hvci5hdHRyKHtcbiAgICAgICAgJ2FyaWEtY29udHJvbHMnOiB0aGlzLmlkLFxuICAgICAgICAnaWQnOiBhbmNob3JJZCxcbiAgICAgICAgJ2FyaWEtaGFzcG9wdXAnOiB0cnVlLFxuICAgICAgICAndGFiaW5kZXgnOiAwXG4gICAgICB9KTtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXR0cih7J2FyaWEtbGFiZWxsZWRieSc6IGFuY2hvcklkfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5mdWxsU2NyZWVuIHx8IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2Z1bGwnKSkge1xuICAgICAgdGhpcy5vcHRpb25zLmZ1bGxTY3JlZW4gPSB0cnVlO1xuICAgICAgdGhpcy5vcHRpb25zLm92ZXJsYXkgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5ICYmICF0aGlzLiRvdmVybGF5KSB7XG4gICAgICB0aGlzLiRvdmVybGF5ID0gdGhpcy5fbWFrZU92ZXJsYXkodGhpcy5pZCk7XG4gICAgfVxuXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKHtcbiAgICAgICAgJ3JvbGUnOiAnZGlhbG9nJyxcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzogdHJ1ZSxcbiAgICAgICAgJ2RhdGEteWV0aS1ib3gnOiB0aGlzLmlkLFxuICAgICAgICAnZGF0YS1yZXNpemUnOiB0aGlzLmlkXG4gICAgfSk7XG5cbiAgICBpZih0aGlzLiRvdmVybGF5KSB7XG4gICAgICB0aGlzLiRlbGVtZW50LmRldGFjaCgpLmFwcGVuZFRvKHRoaXMuJG92ZXJsYXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRlbGVtZW50LmRldGFjaCgpLmFwcGVuZFRvKCQoJ2JvZHknKSk7XG4gICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCd3aXRob3V0LW92ZXJsYXknKTtcbiAgICB9XG4gICAgdGhpcy5fZXZlbnRzKCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5kZWVwTGluayAmJiB3aW5kb3cubG9jYXRpb24uaGFzaCA9PT0gKCBgIyR7dGhpcy5pZH1gKSkge1xuICAgICAgJCh3aW5kb3cpLm9uZSgnbG9hZC56Zi5yZXZlYWwnLCB0aGlzLm9wZW4uYmluZCh0aGlzKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gb3ZlcmxheSBkaXYgdG8gZGlzcGxheSBiZWhpbmQgdGhlIG1vZGFsLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX21ha2VPdmVybGF5KGlkKSB7XG4gICAgdmFyICRvdmVybGF5ID0gJCgnPGRpdj48L2Rpdj4nKVxuICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3JldmVhbC1vdmVybGF5JylcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoeyd0YWJpbmRleCc6IC0xLCAnYXJpYS1oaWRkZW4nOiB0cnVlfSlcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZFRvKCdib2R5Jyk7XG4gICAgcmV0dXJuICRvdmVybGF5O1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgcG9zaXRpb24gb2YgbW9kYWxcbiAgICogVE9ETzogIEZpZ3VyZSBvdXQgaWYgd2UgYWN0dWFsbHkgbmVlZCB0byBjYWNoZSB0aGVzZSB2YWx1ZXMgb3IgaWYgaXQgZG9lc24ndCBtYXR0ZXJcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF91cGRhdGVQb3NpdGlvbigpIHtcbiAgICB2YXIgd2lkdGggPSB0aGlzLiRlbGVtZW50Lm91dGVyV2lkdGgoKTtcbiAgICB2YXIgb3V0ZXJXaWR0aCA9ICQod2luZG93KS53aWR0aCgpO1xuICAgIHZhciBoZWlnaHQgPSB0aGlzLiRlbGVtZW50Lm91dGVySGVpZ2h0KCk7XG4gICAgdmFyIG91dGVySGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpO1xuICAgIHZhciBsZWZ0LCB0b3A7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5oT2Zmc2V0ID09PSAnYXV0bycpIHtcbiAgICAgIGxlZnQgPSBwYXJzZUludCgob3V0ZXJXaWR0aCAtIHdpZHRoKSAvIDIsIDEwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGVmdCA9IHBhcnNlSW50KHRoaXMub3B0aW9ucy5oT2Zmc2V0LCAxMCk7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMudk9mZnNldCA9PT0gJ2F1dG8nKSB7XG4gICAgICBpZiAoaGVpZ2h0ID4gb3V0ZXJIZWlnaHQpIHtcbiAgICAgICAgdG9wID0gcGFyc2VJbnQoTWF0aC5taW4oMTAwLCBvdXRlckhlaWdodCAvIDEwKSwgMTApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdG9wID0gcGFyc2VJbnQoKG91dGVySGVpZ2h0IC0gaGVpZ2h0KSAvIDQsIDEwKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdG9wID0gcGFyc2VJbnQodGhpcy5vcHRpb25zLnZPZmZzZXQsIDEwKTtcbiAgICB9XG4gICAgdGhpcy4kZWxlbWVudC5jc3Moe3RvcDogdG9wICsgJ3B4J30pO1xuICAgIC8vIG9ubHkgd29ycnkgYWJvdXQgbGVmdCBpZiB3ZSBkb24ndCBoYXZlIGFuIG92ZXJsYXkgb3Igd2UgaGF2ZWEgIGhvcml6b250YWwgb2Zmc2V0LFxuICAgIC8vIG90aGVyd2lzZSB3ZSdyZSBwZXJmZWN0bHkgaW4gdGhlIG1pZGRsZVxuICAgIGlmKCF0aGlzLiRvdmVybGF5IHx8ICh0aGlzLm9wdGlvbnMuaE9mZnNldCAhPT0gJ2F1dG8nKSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5jc3Moe2xlZnQ6IGxlZnQgKyAncHgnfSk7XG4gICAgICB0aGlzLiRlbGVtZW50LmNzcyh7bWFyZ2luOiAnMHB4J30pO1xuICAgIH1cblxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgZm9yIHRoZSBtb2RhbC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuJGVsZW1lbnQub24oe1xuICAgICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxuICAgICAgJ2Nsb3NlLnpmLnRyaWdnZXInOiB0aGlzLmNsb3NlLmJpbmQodGhpcyksXG4gICAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxuICAgICAgJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInOiBmdW5jdGlvbigpIHtcbiAgICAgICAgX3RoaXMuX3VwZGF0ZVBvc2l0aW9uKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy4kYW5jaG9yLmxlbmd0aCkge1xuICAgICAgdGhpcy4kYW5jaG9yLm9uKCdrZXlkb3duLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGUud2hpY2ggPT09IDEzIHx8IGUud2hpY2ggPT09IDMyKSB7XG4gICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgX3RoaXMub3BlbigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayAmJiB0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgdGhpcy4kb3ZlcmxheS5vZmYoJy56Zi5yZXZlYWwnKS5vbignY2xpY2suemYucmV2ZWFsJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZS50YXJnZXQgPT09IF90aGlzLiRlbGVtZW50WzBdIHx8ICQuY29udGFpbnMoX3RoaXMuJGVsZW1lbnRbMF0sIGUudGFyZ2V0KSkgeyByZXR1cm47IH1cbiAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZXBMaW5rKSB7XG4gICAgICAkKHdpbmRvdykub24oYHBvcHN0YXRlLnpmLnJldmVhbDoke3RoaXMuaWR9YCwgdGhpcy5faGFuZGxlU3RhdGUuYmluZCh0aGlzKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgbW9kYWwgbWV0aG9kcyBvbiBiYWNrL2ZvcndhcmQgYnV0dG9uIGNsaWNrcyBvciBhbnkgb3RoZXIgZXZlbnQgdGhhdCB0cmlnZ2VycyBwb3BzdGF0ZS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9oYW5kbGVTdGF0ZShlKSB7XG4gICAgaWYod2luZG93LmxvY2F0aW9uLmhhc2ggPT09ICggJyMnICsgdGhpcy5pZCkgJiYgIXRoaXMuaXNBY3RpdmUpeyB0aGlzLm9wZW4oKTsgfVxuICAgIGVsc2V7IHRoaXMuY2xvc2UoKTsgfVxuICB9XG5cblxuICAvKipcbiAgICogT3BlbnMgdGhlIG1vZGFsIGNvbnRyb2xsZWQgYnkgYHRoaXMuJGFuY2hvcmAsIGFuZCBjbG9zZXMgYWxsIG90aGVycyBieSBkZWZhdWx0LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIFJldmVhbCNjbG9zZW1lXG4gICAqIEBmaXJlcyBSZXZlYWwjb3BlblxuICAgKi9cbiAgb3BlbigpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZXBMaW5rKSB7XG4gICAgICB2YXIgaGFzaCA9IGAjJHt0aGlzLmlkfWA7XG5cbiAgICAgIGlmICh3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUpIHtcbiAgICAgICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsIGhhc2gpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBoYXNoO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuaXNBY3RpdmUgPSB0cnVlO1xuXG4gICAgLy8gTWFrZSBlbGVtZW50cyBpbnZpc2libGUsIGJ1dCByZW1vdmUgZGlzcGxheTogbm9uZSBzbyB3ZSBjYW4gZ2V0IHNpemUgYW5kIHBvc2l0aW9uaW5nXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAuY3NzKHsgJ3Zpc2liaWxpdHknOiAnaGlkZGVuJyB9KVxuICAgICAgICAuc2hvdygpXG4gICAgICAgIC5zY3JvbGxUb3AoMCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XG4gICAgICB0aGlzLiRvdmVybGF5LmNzcyh7J3Zpc2liaWxpdHknOiAnaGlkZGVuJ30pLnNob3coKTtcbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVQb3NpdGlvbigpO1xuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLmhpZGUoKVxuICAgICAgLmNzcyh7ICd2aXNpYmlsaXR5JzogJycgfSk7XG5cbiAgICBpZih0aGlzLiRvdmVybGF5KSB7XG4gICAgICB0aGlzLiRvdmVybGF5LmNzcyh7J3Zpc2liaWxpdHknOiAnJ30pLmhpZGUoKTtcbiAgICB9XG5cblxuICAgIGlmICghdGhpcy5vcHRpb25zLm11bHRpcGxlT3BlbmVkKSB7XG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgbW9kYWwgb3BlbnMuXG4gICAgICAgKiBDbG9zZXMgYW55IG90aGVyIG1vZGFscyB0aGF0IGFyZSBjdXJyZW50bHkgb3BlblxuICAgICAgICogQGV2ZW50IFJldmVhbCNjbG9zZW1lXG4gICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignY2xvc2VtZS56Zi5yZXZlYWwnLCB0aGlzLmlkKTtcbiAgICB9XG5cbiAgICAvLyBNb3Rpb24gVUkgbWV0aG9kIG9mIHJldmVhbFxuICAgIGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uSW4pIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlSW4odGhpcy4kb3ZlcmxheSwgJ2ZhZGUtaW4nKTtcbiAgICAgIH1cbiAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVJbih0aGlzLiRlbGVtZW50LCB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uSW4sICgpID0+IHtcbiAgICAgICAgdGhpcy5mb2N1c2FibGVFbGVtZW50cyA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZSh0aGlzLiRlbGVtZW50KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBqUXVlcnkgbWV0aG9kIG9mIHJldmVhbFxuICAgIGVsc2Uge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XG4gICAgICAgIHRoaXMuJG92ZXJsYXkuc2hvdygwKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuJGVsZW1lbnQuc2hvdyh0aGlzLm9wdGlvbnMuc2hvd0RlbGF5KTtcbiAgICB9XG5cbiAgICAvLyBoYW5kbGUgYWNjZXNzaWJpbGl0eVxuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5hdHRyKHtcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzogZmFsc2UsXG4gICAgICAgICd0YWJpbmRleCc6IC0xXG4gICAgICB9KVxuICAgICAgLmZvY3VzKCk7XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBtb2RhbCBoYXMgc3VjY2Vzc2Z1bGx5IG9wZW5lZC5cbiAgICAgKiBAZXZlbnQgUmV2ZWFsI29wZW5cbiAgICAgKi9cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ29wZW4uemYucmV2ZWFsJyk7XG5cbiAgICBpZiAodGhpcy5pc2lPUykge1xuICAgICAgdmFyIHNjcm9sbFBvcyA9IHdpbmRvdy5wYWdlWU9mZnNldDtcbiAgICAgICQoJ2h0bWwsIGJvZHknKS5hZGRDbGFzcygnaXMtcmV2ZWFsLW9wZW4nKS5zY3JvbGxUb3Aoc2Nyb2xsUG9zKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAkKCdib2R5JykuYWRkQ2xhc3MoJ2lzLXJldmVhbC1vcGVuJyk7XG4gICAgfVxuXG4gICAgJCgnYm9keScpXG4gICAgICAuYWRkQ2xhc3MoJ2lzLXJldmVhbC1vcGVuJylcbiAgICAgIC5hdHRyKCdhcmlhLWhpZGRlbicsICh0aGlzLm9wdGlvbnMub3ZlcmxheSB8fCB0aGlzLm9wdGlvbnMuZnVsbFNjcmVlbikgPyB0cnVlIDogZmFsc2UpO1xuXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLl9leHRyYUhhbmRsZXJzKCk7XG4gICAgfSwgMCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBleHRyYSBldmVudCBoYW5kbGVycyBmb3IgdGhlIGJvZHkgYW5kIHdpbmRvdyBpZiBuZWNlc3NhcnkuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXh0cmFIYW5kbGVycygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuZm9jdXNhYmxlRWxlbWVudHMgPSBGb3VuZGF0aW9uLktleWJvYXJkLmZpbmRGb2N1c2FibGUodGhpcy4kZWxlbWVudCk7XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5vdmVybGF5ICYmIHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2sgJiYgIXRoaXMub3B0aW9ucy5mdWxsU2NyZWVuKSB7XG4gICAgICAkKCdib2R5Jykub24oJ2NsaWNrLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGUudGFyZ2V0ID09PSBfdGhpcy4kZWxlbWVudFswXSB8fCAkLmNvbnRhaW5zKF90aGlzLiRlbGVtZW50WzBdLCBlLnRhcmdldCkpIHsgcmV0dXJuOyB9XG4gICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25Fc2MpIHtcbiAgICAgICQod2luZG93KS5vbigna2V5ZG93bi56Zi5yZXZlYWwnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdSZXZlYWwnLCB7XG4gICAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKF90aGlzLm9wdGlvbnMuY2xvc2VPbkVzYykge1xuICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIGxvY2sgZm9jdXMgd2l0aGluIG1vZGFsIHdoaWxlIHRhYmJpbmdcbiAgICB0aGlzLiRlbGVtZW50Lm9uKCdrZXlkb3duLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciAkdGFyZ2V0ID0gJCh0aGlzKTtcbiAgICAgIC8vIGhhbmRsZSBrZXlib2FyZCBldmVudCB3aXRoIGtleWJvYXJkIHV0aWxcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdSZXZlYWwnLCB7XG4gICAgICAgIHRhYl9mb3J3YXJkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoX3RoaXMuJGVsZW1lbnQuZmluZCgnOmZvY3VzJykuaXMoX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMuZXEoLTEpKSkgeyAvLyBsZWZ0IG1vZGFsIGRvd253YXJkcywgc2V0dGluZyBmb2N1cyB0byBmaXJzdCBlbGVtZW50XG4gICAgICAgICAgICBfdGhpcy5mb2N1c2FibGVFbGVtZW50cy5lcSgwKS5mb2N1cygpO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMubGVuZ3RoID09PSAwKSB7IC8vIG5vIGZvY3VzYWJsZSBlbGVtZW50cyBpbnNpZGUgdGhlIG1vZGFsIGF0IGFsbCwgcHJldmVudCB0YWJiaW5nIGluIGdlbmVyYWxcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRhYl9iYWNrd2FyZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKF90aGlzLiRlbGVtZW50LmZpbmQoJzpmb2N1cycpLmlzKF90aGlzLmZvY3VzYWJsZUVsZW1lbnRzLmVxKDApKSB8fCBfdGhpcy4kZWxlbWVudC5pcygnOmZvY3VzJykpIHsgLy8gbGVmdCBtb2RhbCB1cHdhcmRzLCBzZXR0aW5nIGZvY3VzIHRvIGxhc3QgZWxlbWVudFxuICAgICAgICAgICAgX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMuZXEoLTEpLmZvY3VzKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChfdGhpcy5mb2N1c2FibGVFbGVtZW50cy5sZW5ndGggPT09IDApIHsgLy8gbm8gZm9jdXNhYmxlIGVsZW1lbnRzIGluc2lkZSB0aGUgbW9kYWwgYXQgYWxsLCBwcmV2ZW50IHRhYmJpbmcgaW4gZ2VuZXJhbFxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKF90aGlzLiRlbGVtZW50LmZpbmQoJzpmb2N1cycpLmlzKF90aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLWNsb3NlXScpKSkge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgLy8gc2V0IGZvY3VzIGJhY2sgdG8gYW5jaG9yIGlmIGNsb3NlIGJ1dHRvbiBoYXMgYmVlbiBhY3RpdmF0ZWRcbiAgICAgICAgICAgICAgX3RoaXMuJGFuY2hvci5mb2N1cygpO1xuICAgICAgICAgICAgfSwgMSk7XG4gICAgICAgICAgfSBlbHNlIGlmICgkdGFyZ2V0LmlzKF90aGlzLmZvY3VzYWJsZUVsZW1lbnRzKSkgeyAvLyBkb250J3QgdHJpZ2dlciBpZiBhY3VhbCBlbGVtZW50IGhhcyBmb2N1cyAoaS5lLiBpbnB1dHMsIGxpbmtzLCAuLi4pXG4gICAgICAgICAgICBfdGhpcy5vcGVuKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKF90aGlzLm9wdGlvbnMuY2xvc2VPbkVzYykge1xuICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZm9jdXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgbW9kYWwuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAZmlyZXMgUmV2ZWFsI2Nsb3NlZFxuICAgKi9cbiAgY2xvc2UoKSB7XG4gICAgaWYgKCF0aGlzLmlzQWN0aXZlIHx8ICF0aGlzLiRlbGVtZW50LmlzKCc6dmlzaWJsZScpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAvLyBNb3Rpb24gVUkgbWV0aG9kIG9mIGhpZGluZ1xuICAgIGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uT3V0KSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkpIHtcbiAgICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCh0aGlzLiRvdmVybGF5LCAnZmFkZS1vdXQnLCBmaW5pc2hVcCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgZmluaXNoVXAoKTtcbiAgICAgIH1cblxuICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCh0aGlzLiRlbGVtZW50LCB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uT3V0KTtcbiAgICB9XG4gICAgLy8galF1ZXJ5IG1ldGhvZCBvZiBoaWRpbmdcbiAgICBlbHNlIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgICB0aGlzLiRvdmVybGF5LmhpZGUoMCwgZmluaXNoVXApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGZpbmlzaFVwKCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuJGVsZW1lbnQuaGlkZSh0aGlzLm9wdGlvbnMuaGlkZURlbGF5KTtcbiAgICB9XG5cbiAgICAvLyBDb25kaXRpb25hbHMgdG8gcmVtb3ZlIGV4dHJhIGV2ZW50IGxpc3RlbmVycyBhZGRlZCBvbiBvcGVuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uRXNjKSB7XG4gICAgICAkKHdpbmRvdykub2ZmKCdrZXlkb3duLnpmLnJldmVhbCcpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5vcHRpb25zLm92ZXJsYXkgJiYgdGhpcy5vcHRpb25zLmNsb3NlT25DbGljaykge1xuICAgICAgJCgnYm9keScpLm9mZignY2xpY2suemYucmV2ZWFsJyk7XG4gICAgfVxuXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJ2tleWRvd24uemYucmV2ZWFsJyk7XG5cbiAgICBmdW5jdGlvbiBmaW5pc2hVcCgpIHtcbiAgICAgIGlmIChfdGhpcy5pc2lPUykge1xuICAgICAgICAkKCdodG1sLCBib2R5JykucmVtb3ZlQ2xhc3MoJ2lzLXJldmVhbC1vcGVuJyk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgJCgnYm9keScpLnJlbW92ZUNsYXNzKCdpcy1yZXZlYWwtb3BlbicpO1xuICAgICAgfVxuXG4gICAgICAkKCdib2R5JykuYXR0cih7XG4gICAgICAgICdhcmlhLWhpZGRlbic6IGZhbHNlLFxuICAgICAgICAndGFiaW5kZXgnOiAnJ1xuICAgICAgfSk7XG5cbiAgICAgIF90aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgdHJ1ZSk7XG5cbiAgICAgIC8qKlxuICAgICAgKiBGaXJlcyB3aGVuIHRoZSBtb2RhbCBpcyBkb25lIGNsb3NpbmcuXG4gICAgICAqIEBldmVudCBSZXZlYWwjY2xvc2VkXG4gICAgICAqL1xuICAgICAgX3RoaXMuJGVsZW1lbnQudHJpZ2dlcignY2xvc2VkLnpmLnJldmVhbCcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogUmVzZXRzIHRoZSBtb2RhbCBjb250ZW50XG4gICAgKiBUaGlzIHByZXZlbnRzIGEgcnVubmluZyB2aWRlbyB0byBrZWVwIGdvaW5nIGluIHRoZSBiYWNrZ3JvdW5kXG4gICAgKi9cbiAgICBpZiAodGhpcy5vcHRpb25zLnJlc2V0T25DbG9zZSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5odG1sKHRoaXMuJGVsZW1lbnQuaHRtbCgpKTtcbiAgICB9XG5cbiAgICB0aGlzLmlzQWN0aXZlID0gZmFsc2U7XG4gICAgIGlmIChfdGhpcy5vcHRpb25zLmRlZXBMaW5rKSB7XG4gICAgICAgaWYgKHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZSkge1xuICAgICAgICAgd2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlKFwiXCIsIGRvY3VtZW50LnRpdGxlLCB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgIH0gZWxzZSB7XG4gICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9ICcnO1xuICAgICAgIH1cbiAgICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIG9wZW4vY2xvc2VkIHN0YXRlIG9mIGEgbW9kYWwuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgdG9nZ2xlKCkge1xuICAgIGlmICh0aGlzLmlzQWN0aXZlKSB7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub3BlbigpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgYSBtb2RhbC5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5hcHBlbmRUbygkKCdib2R5JykpOyAvLyBtb3ZlICRlbGVtZW50IG91dHNpZGUgb2YgJG92ZXJsYXkgdG8gcHJldmVudCBlcnJvciB1bnJlZ2lzdGVyUGx1Z2luKClcbiAgICAgIHRoaXMuJG92ZXJsYXkuaGlkZSgpLm9mZigpLnJlbW92ZSgpO1xuICAgIH1cbiAgICB0aGlzLiRlbGVtZW50LmhpZGUoKS5vZmYoKTtcbiAgICB0aGlzLiRhbmNob3Iub2ZmKCcuemYnKTtcbiAgICAkKHdpbmRvdykub2ZmKGAuemYucmV2ZWFsOiR7dGhpcy5pZH1gKTtcblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfTtcbn1cblxuUmV2ZWFsLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogTW90aW9uLVVJIGNsYXNzIHRvIHVzZSBmb3IgYW5pbWF0ZWQgZWxlbWVudHMuIElmIG5vbmUgdXNlZCwgZGVmYXVsdHMgdG8gc2ltcGxlIHNob3cvaGlkZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnc2xpZGUtaW4tbGVmdCdcbiAgICovXG4gIGFuaW1hdGlvbkluOiAnJyxcbiAgLyoqXG4gICAqIE1vdGlvbi1VSSBjbGFzcyB0byB1c2UgZm9yIGFuaW1hdGVkIGVsZW1lbnRzLiBJZiBub25lIHVzZWQsIGRlZmF1bHRzIHRvIHNpbXBsZSBzaG93L2hpZGUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ3NsaWRlLW91dC1yaWdodCdcbiAgICovXG4gIGFuaW1hdGlvbk91dDogJycsXG4gIC8qKlxuICAgKiBUaW1lLCBpbiBtcywgdG8gZGVsYXkgdGhlIG9wZW5pbmcgb2YgYSBtb2RhbCBhZnRlciBhIGNsaWNrIGlmIG5vIGFuaW1hdGlvbiB1c2VkLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDEwXG4gICAqL1xuICBzaG93RGVsYXk6IDAsXG4gIC8qKlxuICAgKiBUaW1lLCBpbiBtcywgdG8gZGVsYXkgdGhlIGNsb3Npbmcgb2YgYSBtb2RhbCBhZnRlciBhIGNsaWNrIGlmIG5vIGFuaW1hdGlvbiB1c2VkLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDEwXG4gICAqL1xuICBoaWRlRGVsYXk6IDAsXG4gIC8qKlxuICAgKiBBbGxvd3MgYSBjbGljayBvbiB0aGUgYm9keS9vdmVybGF5IHRvIGNsb3NlIHRoZSBtb2RhbC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjbG9zZU9uQ2xpY2s6IHRydWUsXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGNsb3NlIGlmIHRoZSB1c2VyIHByZXNzZXMgdGhlIGBFU0NBUEVgIGtleS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjbG9zZU9uRXNjOiB0cnVlLFxuICAvKipcbiAgICogSWYgdHJ1ZSwgYWxsb3dzIG11bHRpcGxlIG1vZGFscyB0byBiZSBkaXNwbGF5ZWQgYXQgb25jZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgbXVsdGlwbGVPcGVuZWQ6IGZhbHNlLFxuICAvKipcbiAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIG1vZGFsIHNob3VsZCBwdXNoIGRvd24gZnJvbSB0aGUgdG9wIG9mIHRoZSBzY3JlZW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgYXV0b1xuICAgKi9cbiAgdk9mZnNldDogJ2F1dG8nLFxuICAvKipcbiAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIG1vZGFsIHNob3VsZCBwdXNoIGluIGZyb20gdGhlIHNpZGUgb2YgdGhlIHNjcmVlbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBhdXRvXG4gICAqL1xuICBoT2Zmc2V0OiAnYXV0bycsXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGJlIGZ1bGxzY3JlZW4sIGNvbXBsZXRlbHkgYmxvY2tpbmcgb3V0IHRoZSByZXN0IG9mIHRoZSB2aWV3LiBKUyBjaGVja3MgZm9yIHRoaXMgYXMgd2VsbC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgZnVsbFNjcmVlbjogZmFsc2UsXG4gIC8qKlxuICAgKiBQZXJjZW50YWdlIG9mIHNjcmVlbiBoZWlnaHQgdGhlIG1vZGFsIHNob3VsZCBwdXNoIHVwIGZyb20gdGhlIGJvdHRvbSBvZiB0aGUgdmlldy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAxMFxuICAgKi9cbiAgYnRtT2Zmc2V0UGN0OiAxMCxcbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgbW9kYWwgdG8gZ2VuZXJhdGUgYW4gb3ZlcmxheSBkaXYsIHdoaWNoIHdpbGwgY292ZXIgdGhlIHZpZXcgd2hlbiBtb2RhbCBvcGVucy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBvdmVybGF5OiB0cnVlLFxuICAvKipcbiAgICogQWxsb3dzIHRoZSBtb2RhbCB0byByZW1vdmUgYW5kIHJlaW5qZWN0IG1hcmt1cCBvbiBjbG9zZS4gU2hvdWxkIGJlIHRydWUgaWYgdXNpbmcgdmlkZW8gZWxlbWVudHMgdy9vIHVzaW5nIHByb3ZpZGVyJ3MgYXBpLCBvdGhlcndpc2UsIHZpZGVvcyB3aWxsIGNvbnRpbnVlIHRvIHBsYXkgaW4gdGhlIGJhY2tncm91bmQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIHJlc2V0T25DbG9zZTogZmFsc2UsXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGFsdGVyIHRoZSB1cmwgb24gb3Blbi9jbG9zZSwgYW5kIGFsbG93cyB0aGUgdXNlIG9mIHRoZSBgYmFja2AgYnV0dG9uIHRvIGNsb3NlIG1vZGFscy4gQUxTTywgYWxsb3dzIGEgbW9kYWwgdG8gYXV0by1tYW5pYWNhbGx5IG9wZW4gb24gcGFnZSBsb2FkIElGIHRoZSBoYXNoID09PSB0aGUgbW9kYWwncyB1c2VyLXNldCBpZC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgZGVlcExpbms6IGZhbHNlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oUmV2ZWFsLCAnUmV2ZWFsJyk7XG5cbmZ1bmN0aW9uIGlQaG9uZVNuaWZmKCkge1xuICByZXR1cm4gL2lQKGFkfGhvbmV8b2QpLipPUy8udGVzdCh3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCk7XG59XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBTbGlkZXIgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnNsaWRlclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb25cbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudG91Y2hcbiAqL1xuXG5jbGFzcyBTbGlkZXIge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIGRyaWxsZG93biBtZW51LlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhbiBhY2NvcmRpb24gbWVudS5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBTbGlkZXIuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1NsaWRlcicpO1xuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ1NsaWRlcicsIHtcbiAgICAgICdsdHInOiB7XG4gICAgICAgICdBUlJPV19SSUdIVCc6ICdpbmNyZWFzZScsXG4gICAgICAgICdBUlJPV19VUCc6ICdpbmNyZWFzZScsXG4gICAgICAgICdBUlJPV19ET1dOJzogJ2RlY3JlYXNlJyxcbiAgICAgICAgJ0FSUk9XX0xFRlQnOiAnZGVjcmVhc2UnLFxuICAgICAgICAnU0hJRlRfQVJST1dfUklHSFQnOiAnaW5jcmVhc2VfZmFzdCcsXG4gICAgICAgICdTSElGVF9BUlJPV19VUCc6ICdpbmNyZWFzZV9mYXN0JyxcbiAgICAgICAgJ1NISUZUX0FSUk9XX0RPV04nOiAnZGVjcmVhc2VfZmFzdCcsXG4gICAgICAgICdTSElGVF9BUlJPV19MRUZUJzogJ2RlY3JlYXNlX2Zhc3QnXG4gICAgICB9LFxuICAgICAgJ3J0bCc6IHtcbiAgICAgICAgJ0FSUk9XX0xFRlQnOiAnaW5jcmVhc2UnLFxuICAgICAgICAnQVJST1dfUklHSFQnOiAnZGVjcmVhc2UnLFxuICAgICAgICAnU0hJRlRfQVJST1dfTEVGVCc6ICdpbmNyZWFzZV9mYXN0JyxcbiAgICAgICAgJ1NISUZUX0FSUk9XX1JJR0hUJzogJ2RlY3JlYXNlX2Zhc3QnXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlsaXplcyB0aGUgcGx1Z2luIGJ5IHJlYWRpbmcvc2V0dGluZyBhdHRyaWJ1dGVzLCBjcmVhdGluZyBjb2xsZWN0aW9ucyBhbmQgc2V0dGluZyB0aGUgaW5pdGlhbCBwb3NpdGlvbiBvZiB0aGUgaGFuZGxlKHMpLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHRoaXMuaW5wdXRzID0gdGhpcy4kZWxlbWVudC5maW5kKCdpbnB1dCcpO1xuICAgIHRoaXMuaGFuZGxlcyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtc2xpZGVyLWhhbmRsZV0nKTtcblxuICAgIHRoaXMuJGhhbmRsZSA9IHRoaXMuaGFuZGxlcy5lcSgwKTtcbiAgICB0aGlzLiRpbnB1dCA9IHRoaXMuaW5wdXRzLmxlbmd0aCA/IHRoaXMuaW5wdXRzLmVxKDApIDogJChgIyR7dGhpcy4kaGFuZGxlLmF0dHIoJ2FyaWEtY29udHJvbHMnKX1gKTtcbiAgICB0aGlzLiRmaWxsID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zbGlkZXItZmlsbF0nKS5jc3ModGhpcy5vcHRpb25zLnZlcnRpY2FsID8gJ2hlaWdodCcgOiAnd2lkdGgnLCAwKTtcblxuICAgIHZhciBpc0RibCA9IGZhbHNlLFxuICAgICAgICBfdGhpcyA9IHRoaXM7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5kaXNhYmxlZCB8fCB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKHRoaXMub3B0aW9ucy5kaXNhYmxlZENsYXNzKSkge1xuICAgICAgdGhpcy5vcHRpb25zLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmRpc2FibGVkQ2xhc3MpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuaW5wdXRzLmxlbmd0aCkge1xuICAgICAgdGhpcy5pbnB1dHMgPSAkKCkuYWRkKHRoaXMuJGlucHV0KTtcbiAgICAgIHRoaXMub3B0aW9ucy5iaW5kaW5nID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5fc2V0SW5pdEF0dHIoMCk7XG4gICAgdGhpcy5fZXZlbnRzKHRoaXMuJGhhbmRsZSk7XG5cbiAgICBpZiAodGhpcy5oYW5kbGVzWzFdKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuZG91YmxlU2lkZWQgPSB0cnVlO1xuICAgICAgdGhpcy4kaGFuZGxlMiA9IHRoaXMuaGFuZGxlcy5lcSgxKTtcbiAgICAgIHRoaXMuJGlucHV0MiA9IHRoaXMuaW5wdXRzLmxlbmd0aCA+IDEgPyB0aGlzLmlucHV0cy5lcSgxKSA6ICQoYCMke3RoaXMuJGhhbmRsZTIuYXR0cignYXJpYS1jb250cm9scycpfWApO1xuXG4gICAgICBpZiAoIXRoaXMuaW5wdXRzWzFdKSB7XG4gICAgICAgIHRoaXMuaW5wdXRzID0gdGhpcy5pbnB1dHMuYWRkKHRoaXMuJGlucHV0Mik7XG4gICAgICB9XG4gICAgICBpc0RibCA9IHRydWU7XG5cbiAgICAgIHRoaXMuX3NldEhhbmRsZVBvcyh0aGlzLiRoYW5kbGUsIHRoaXMub3B0aW9ucy5pbml0aWFsU3RhcnQsIHRydWUsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIF90aGlzLl9zZXRIYW5kbGVQb3MoX3RoaXMuJGhhbmRsZTIsIF90aGlzLm9wdGlvbnMuaW5pdGlhbEVuZCwgdHJ1ZSk7XG4gICAgICB9KTtcbiAgICAgIC8vIHRoaXMuJGhhbmRsZS50cmlnZ2VySGFuZGxlcignY2xpY2suemYuc2xpZGVyJyk7XG4gICAgICB0aGlzLl9zZXRJbml0QXR0cigxKTtcbiAgICAgIHRoaXMuX2V2ZW50cyh0aGlzLiRoYW5kbGUyKTtcbiAgICB9XG5cbiAgICBpZiAoIWlzRGJsKSB7XG4gICAgICB0aGlzLl9zZXRIYW5kbGVQb3ModGhpcy4kaGFuZGxlLCB0aGlzLm9wdGlvbnMuaW5pdGlhbFN0YXJ0LCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gb2YgdGhlIHNlbGVjdGVkIGhhbmRsZSBhbmQgZmlsbCBiYXIuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGhuZGwgLSB0aGUgc2VsZWN0ZWQgaGFuZGxlIHRvIG1vdmUuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsb2NhdGlvbiAtIGZsb2F0aW5nIHBvaW50IGJldHdlZW4gdGhlIHN0YXJ0IGFuZCBlbmQgdmFsdWVzIG9mIHRoZSBzbGlkZXIgYmFyLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGZpcmUgb24gY29tcGxldGlvbi5cbiAgICogQGZpcmVzIFNsaWRlciNtb3ZlZFxuICAgKiBAZmlyZXMgU2xpZGVyI2NoYW5nZWRcbiAgICovXG4gIF9zZXRIYW5kbGVQb3MoJGhuZGwsIGxvY2F0aW9uLCBub0ludmVydCwgY2IpIHtcbiAgLy9taWdodCBuZWVkIHRvIGFsdGVyIHRoYXQgc2xpZ2h0bHkgZm9yIGJhcnMgdGhhdCB3aWxsIGhhdmUgb2RkIG51bWJlciBzZWxlY3Rpb25zLlxuICAgIGxvY2F0aW9uID0gcGFyc2VGbG9hdChsb2NhdGlvbik7Ly9vbiBpbnB1dCBjaGFuZ2UgZXZlbnRzLCBjb252ZXJ0IHN0cmluZyB0byBudW1iZXIuLi5ncnVtYmxlLlxuXG4gICAgLy8gcHJldmVudCBzbGlkZXIgZnJvbSBydW5uaW5nIG91dCBvZiBib3VuZHMsIGlmIHZhbHVlIGV4Y2VlZHMgdGhlIGxpbWl0cyBzZXQgdGhyb3VnaCBvcHRpb25zLCBvdmVycmlkZSB0aGUgdmFsdWUgdG8gbWluL21heFxuICAgIGlmIChsb2NhdGlvbiA8IHRoaXMub3B0aW9ucy5zdGFydCkgeyBsb2NhdGlvbiA9IHRoaXMub3B0aW9ucy5zdGFydDsgfVxuICAgIGVsc2UgaWYgKGxvY2F0aW9uID4gdGhpcy5vcHRpb25zLmVuZCkgeyBsb2NhdGlvbiA9IHRoaXMub3B0aW9ucy5lbmQ7IH1cblxuICAgIHZhciBpc0RibCA9IHRoaXMub3B0aW9ucy5kb3VibGVTaWRlZDtcblxuICAgIGlmIChpc0RibCkgeyAvL3RoaXMgYmxvY2sgaXMgdG8gcHJldmVudCAyIGhhbmRsZXMgZnJvbSBjcm9zc2luZyBlYWNob3RoZXIuIENvdWxkL3Nob3VsZCBiZSBpbXByb3ZlZC5cbiAgICAgIGlmICh0aGlzLmhhbmRsZXMuaW5kZXgoJGhuZGwpID09PSAwKSB7XG4gICAgICAgIHZhciBoMlZhbCA9IHBhcnNlRmxvYXQodGhpcy4kaGFuZGxlMi5hdHRyKCdhcmlhLXZhbHVlbm93JykpO1xuICAgICAgICBsb2NhdGlvbiA9IGxvY2F0aW9uID49IGgyVmFsID8gaDJWYWwgLSB0aGlzLm9wdGlvbnMuc3RlcCA6IGxvY2F0aW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGgxVmFsID0gcGFyc2VGbG9hdCh0aGlzLiRoYW5kbGUuYXR0cignYXJpYS12YWx1ZW5vdycpKTtcbiAgICAgICAgbG9jYXRpb24gPSBsb2NhdGlvbiA8PSBoMVZhbCA/IGgxVmFsICsgdGhpcy5vcHRpb25zLnN0ZXAgOiBsb2NhdGlvbjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL3RoaXMgaXMgZm9yIHNpbmdsZS1oYW5kbGVkIHZlcnRpY2FsIHNsaWRlcnMsIGl0IGFkanVzdHMgdGhlIHZhbHVlIHRvIGFjY291bnQgZm9yIHRoZSBzbGlkZXIgYmVpbmcgXCJ1cHNpZGUtZG93blwiXG4gICAgLy9mb3IgY2xpY2sgYW5kIGRyYWcgZXZlbnRzLCBpdCdzIHdlaXJkIGR1ZSB0byB0aGUgc2NhbGUoLTEsIDEpIGNzcyBwcm9wZXJ0eVxuICAgIGlmICh0aGlzLm9wdGlvbnMudmVydGljYWwgJiYgIW5vSW52ZXJ0KSB7XG4gICAgICBsb2NhdGlvbiA9IHRoaXMub3B0aW9ucy5lbmQgLSBsb2NhdGlvbjtcbiAgICB9XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICB2ZXJ0ID0gdGhpcy5vcHRpb25zLnZlcnRpY2FsLFxuICAgICAgICBoT3JXID0gdmVydCA/ICdoZWlnaHQnIDogJ3dpZHRoJyxcbiAgICAgICAgbE9yVCA9IHZlcnQgPyAndG9wJyA6ICdsZWZ0JyxcbiAgICAgICAgaGFuZGxlRGltID0gJGhuZGxbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClbaE9yV10sXG4gICAgICAgIGVsZW1EaW0gPSB0aGlzLiRlbGVtZW50WzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpW2hPclddLFxuICAgICAgICAvL3BlcmNlbnRhZ2Ugb2YgYmFyIG1pbi9tYXggdmFsdWUgYmFzZWQgb24gY2xpY2sgb3IgZHJhZyBwb2ludFxuICAgICAgICBwY3RPZkJhciA9IHBlcmNlbnQobG9jYXRpb24gLSB0aGlzLm9wdGlvbnMuc3RhcnQsIHRoaXMub3B0aW9ucy5lbmQgLSB0aGlzLm9wdGlvbnMuc3RhcnQpLnRvRml4ZWQoMiksXG4gICAgICAgIC8vbnVtYmVyIG9mIGFjdHVhbCBwaXhlbHMgdG8gc2hpZnQgdGhlIGhhbmRsZSwgYmFzZWQgb24gdGhlIHBlcmNlbnRhZ2Ugb2J0YWluZWQgYWJvdmVcbiAgICAgICAgcHhUb01vdmUgPSAoZWxlbURpbSAtIGhhbmRsZURpbSkgKiBwY3RPZkJhcixcbiAgICAgICAgLy9wZXJjZW50YWdlIG9mIGJhciB0byBzaGlmdCB0aGUgaGFuZGxlXG4gICAgICAgIG1vdmVtZW50ID0gKHBlcmNlbnQocHhUb01vdmUsIGVsZW1EaW0pICogMTAwKS50b0ZpeGVkKHRoaXMub3B0aW9ucy5kZWNpbWFsKTtcbiAgICAgICAgLy9maXhpbmcgdGhlIGRlY2ltYWwgdmFsdWUgZm9yIHRoZSBsb2NhdGlvbiBudW1iZXIsIGlzIHBhc3NlZCB0byBvdGhlciBtZXRob2RzIGFzIGEgZml4ZWQgZmxvYXRpbmctcG9pbnQgdmFsdWVcbiAgICAgICAgbG9jYXRpb24gPSBwYXJzZUZsb2F0KGxvY2F0aW9uLnRvRml4ZWQodGhpcy5vcHRpb25zLmRlY2ltYWwpKTtcbiAgICAgICAgLy8gZGVjbGFyZSBlbXB0eSBvYmplY3QgZm9yIGNzcyBhZGp1c3RtZW50cywgb25seSB1c2VkIHdpdGggMiBoYW5kbGVkLXNsaWRlcnNcbiAgICB2YXIgY3NzID0ge307XG5cbiAgICB0aGlzLl9zZXRWYWx1ZXMoJGhuZGwsIGxvY2F0aW9uKTtcblxuICAgIC8vIFRPRE8gdXBkYXRlIHRvIGNhbGN1bGF0ZSBiYXNlZCBvbiB2YWx1ZXMgc2V0IHRvIHJlc3BlY3RpdmUgaW5wdXRzPz9cbiAgICBpZiAoaXNEYmwpIHtcbiAgICAgIHZhciBpc0xlZnRIbmRsID0gdGhpcy5oYW5kbGVzLmluZGV4KCRobmRsKSA9PT0gMCxcbiAgICAgICAgICAvL2VtcHR5IHZhcmlhYmxlLCB3aWxsIGJlIHVzZWQgZm9yIG1pbi1oZWlnaHQvd2lkdGggZm9yIGZpbGwgYmFyXG4gICAgICAgICAgZGltLFxuICAgICAgICAgIC8vcGVyY2VudGFnZSB3L2ggb2YgdGhlIGhhbmRsZSBjb21wYXJlZCB0byB0aGUgc2xpZGVyIGJhclxuICAgICAgICAgIGhhbmRsZVBjdCA9ICB+fihwZXJjZW50KGhhbmRsZURpbSwgZWxlbURpbSkgKiAxMDApO1xuICAgICAgLy9pZiBsZWZ0IGhhbmRsZSwgdGhlIG1hdGggaXMgc2xpZ2h0bHkgZGlmZmVyZW50IHRoYW4gaWYgaXQncyB0aGUgcmlnaHQgaGFuZGxlLCBhbmQgdGhlIGxlZnQvdG9wIHByb3BlcnR5IG5lZWRzIHRvIGJlIGNoYW5nZWQgZm9yIHRoZSBmaWxsIGJhclxuICAgICAgaWYgKGlzTGVmdEhuZGwpIHtcbiAgICAgICAgLy9sZWZ0IG9yIHRvcCBwZXJjZW50YWdlIHZhbHVlIHRvIGFwcGx5IHRvIHRoZSBmaWxsIGJhci5cbiAgICAgICAgY3NzW2xPclRdID0gYCR7bW92ZW1lbnR9JWA7XG4gICAgICAgIC8vY2FsY3VsYXRlIHRoZSBuZXcgbWluLWhlaWdodC93aWR0aCBmb3IgdGhlIGZpbGwgYmFyLlxuICAgICAgICBkaW0gPSBwYXJzZUZsb2F0KHRoaXMuJGhhbmRsZTJbMF0uc3R5bGVbbE9yVF0pIC0gbW92ZW1lbnQgKyBoYW5kbGVQY3Q7XG4gICAgICAgIC8vdGhpcyBjYWxsYmFjayBpcyBuZWNlc3NhcnkgdG8gcHJldmVudCBlcnJvcnMgYW5kIGFsbG93IHRoZSBwcm9wZXIgcGxhY2VtZW50IGFuZCBpbml0aWFsaXphdGlvbiBvZiBhIDItaGFuZGxlZCBzbGlkZXJcbiAgICAgICAgLy9wbHVzLCBpdCBtZWFucyB3ZSBkb24ndCBjYXJlIGlmICdkaW0nIGlzTmFOIG9uIGluaXQsIGl0IHdvbid0IGJlIGluIHRoZSBmdXR1cmUuXG4gICAgICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHsgY2IoKTsgfS8vdGhpcyBpcyBvbmx5IG5lZWRlZCBmb3IgdGhlIGluaXRpYWxpemF0aW9uIG9mIDIgaGFuZGxlZCBzbGlkZXJzXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL2p1c3QgY2FjaGluZyB0aGUgdmFsdWUgb2YgdGhlIGxlZnQvYm90dG9tIGhhbmRsZSdzIGxlZnQvdG9wIHByb3BlcnR5XG4gICAgICAgIHZhciBoYW5kbGVQb3MgPSBwYXJzZUZsb2F0KHRoaXMuJGhhbmRsZVswXS5zdHlsZVtsT3JUXSk7XG4gICAgICAgIC8vY2FsY3VsYXRlIHRoZSBuZXcgbWluLWhlaWdodC93aWR0aCBmb3IgdGhlIGZpbGwgYmFyLiBVc2UgaXNOYU4gdG8gcHJldmVudCBmYWxzZSBwb3NpdGl2ZXMgZm9yIG51bWJlcnMgPD0gMFxuICAgICAgICAvL2Jhc2VkIG9uIHRoZSBwZXJjZW50YWdlIG9mIG1vdmVtZW50IG9mIHRoZSBoYW5kbGUgYmVpbmcgbWFuaXB1bGF0ZWQsIGxlc3MgdGhlIG9wcG9zaW5nIGhhbmRsZSdzIGxlZnQvdG9wIHBvc2l0aW9uLCBwbHVzIHRoZSBwZXJjZW50YWdlIHcvaCBvZiB0aGUgaGFuZGxlIGl0c2VsZlxuICAgICAgICBkaW0gPSBtb3ZlbWVudCAtIChpc05hTihoYW5kbGVQb3MpID8gdGhpcy5vcHRpb25zLmluaXRpYWxTdGFydC8oKHRoaXMub3B0aW9ucy5lbmQtdGhpcy5vcHRpb25zLnN0YXJ0KS8xMDApIDogaGFuZGxlUG9zKSArIGhhbmRsZVBjdDtcbiAgICAgIH1cbiAgICAgIC8vIGFzc2lnbiB0aGUgbWluLWhlaWdodC93aWR0aCB0byBvdXIgY3NzIG9iamVjdFxuICAgICAgY3NzW2BtaW4tJHtoT3JXfWBdID0gYCR7ZGltfSVgO1xuICAgIH1cblxuICAgIHRoaXMuJGVsZW1lbnQub25lKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBoYW5kbGUgaXMgZG9uZSBtb3ZpbmcuXG4gICAgICAgICAgICAgICAgICAgICAqIEBldmVudCBTbGlkZXIjbW92ZWRcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRlbGVtZW50LnRyaWdnZXIoJ21vdmVkLnpmLnNsaWRlcicsIFskaG5kbF0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgLy9iZWNhdXNlIHdlIGRvbid0IGtub3cgZXhhY3RseSBob3cgdGhlIGhhbmRsZSB3aWxsIGJlIG1vdmVkLCBjaGVjayB0aGUgYW1vdW50IG9mIHRpbWUgaXQgc2hvdWxkIHRha2UgdG8gbW92ZS5cbiAgICB2YXIgbW92ZVRpbWUgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ2RyYWdnaW5nJykgPyAxMDAwLzYwIDogdGhpcy5vcHRpb25zLm1vdmVUaW1lO1xuXG4gICAgRm91bmRhdGlvbi5Nb3ZlKG1vdmVUaW1lLCAkaG5kbCwgZnVuY3Rpb24oKSB7XG4gICAgICAvL2FkanVzdGluZyB0aGUgbGVmdC90b3AgcHJvcGVydHkgb2YgdGhlIGhhbmRsZSwgYmFzZWQgb24gdGhlIHBlcmNlbnRhZ2UgY2FsY3VsYXRlZCBhYm92ZVxuICAgICAgJGhuZGwuY3NzKGxPclQsIGAke21vdmVtZW50fSVgKTtcblxuICAgICAgaWYgKCFfdGhpcy5vcHRpb25zLmRvdWJsZVNpZGVkKSB7XG4gICAgICAgIC8vaWYgc2luZ2xlLWhhbmRsZWQsIGEgc2ltcGxlIG1ldGhvZCB0byBleHBhbmQgdGhlIGZpbGwgYmFyXG4gICAgICAgIF90aGlzLiRmaWxsLmNzcyhoT3JXLCBgJHtwY3RPZkJhciAqIDEwMH0lYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL290aGVyd2lzZSwgdXNlIHRoZSBjc3Mgb2JqZWN0IHdlIGNyZWF0ZWQgYWJvdmVcbiAgICAgICAgX3RoaXMuJGZpbGwuY3NzKGNzcyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSB2YWx1ZSBoYXMgbm90IGJlZW4gY2hhbmdlIGZvciBhIGdpdmVuIHRpbWUuXG4gICAgICogQGV2ZW50IFNsaWRlciNjaGFuZ2VkXG4gICAgICovICAgIFxuICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcbiAgICBfdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgX3RoaXMuJGVsZW1lbnQudHJpZ2dlcignY2hhbmdlZC56Zi5zbGlkZXInLCBbJGhuZGxdKTtcbiAgICB9LCBfdGhpcy5vcHRpb25zLmNoYW5nZWREZWxheSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW5pdGlhbCBhdHRyaWJ1dGUgZm9yIHRoZSBzbGlkZXIgZWxlbWVudC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpZHggLSBpbmRleCBvZiB0aGUgY3VycmVudCBoYW5kbGUvaW5wdXQgdG8gdXNlLlxuICAgKi9cbiAgX3NldEluaXRBdHRyKGlkeCkge1xuICAgIHZhciBpZCA9IHRoaXMuaW5wdXRzLmVxKGlkeCkuYXR0cignaWQnKSB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdzbGlkZXInKTtcbiAgICB0aGlzLmlucHV0cy5lcShpZHgpLmF0dHIoe1xuICAgICAgJ2lkJzogaWQsXG4gICAgICAnbWF4JzogdGhpcy5vcHRpb25zLmVuZCxcbiAgICAgICdtaW4nOiB0aGlzLm9wdGlvbnMuc3RhcnQsXG4gICAgICAnc3RlcCc6IHRoaXMub3B0aW9ucy5zdGVwXG4gICAgfSk7XG4gICAgdGhpcy5oYW5kbGVzLmVxKGlkeCkuYXR0cih7XG4gICAgICAncm9sZSc6ICdzbGlkZXInLFxuICAgICAgJ2FyaWEtY29udHJvbHMnOiBpZCxcbiAgICAgICdhcmlhLXZhbHVlbWF4JzogdGhpcy5vcHRpb25zLmVuZCxcbiAgICAgICdhcmlhLXZhbHVlbWluJzogdGhpcy5vcHRpb25zLnN0YXJ0LFxuICAgICAgJ2FyaWEtdmFsdWVub3cnOiBpZHggPT09IDAgPyB0aGlzLm9wdGlvbnMuaW5pdGlhbFN0YXJ0IDogdGhpcy5vcHRpb25zLmluaXRpYWxFbmQsXG4gICAgICAnYXJpYS1vcmllbnRhdGlvbic6IHRoaXMub3B0aW9ucy52ZXJ0aWNhbCA/ICd2ZXJ0aWNhbCcgOiAnaG9yaXpvbnRhbCcsXG4gICAgICAndGFiaW5kZXgnOiAwXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW5wdXQgYW5kIGBhcmlhLXZhbHVlbm93YCB2YWx1ZXMgZm9yIHRoZSBzbGlkZXIgZWxlbWVudC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkaGFuZGxlIC0gdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBoYW5kbGUuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB2YWwgLSBmbG9hdGluZyBwb2ludCBvZiB0aGUgbmV3IHZhbHVlLlxuICAgKi9cbiAgX3NldFZhbHVlcygkaGFuZGxlLCB2YWwpIHtcbiAgICB2YXIgaWR4ID0gdGhpcy5vcHRpb25zLmRvdWJsZVNpZGVkID8gdGhpcy5oYW5kbGVzLmluZGV4KCRoYW5kbGUpIDogMDtcbiAgICB0aGlzLmlucHV0cy5lcShpZHgpLnZhbCh2YWwpO1xuICAgICRoYW5kbGUuYXR0cignYXJpYS12YWx1ZW5vdycsIHZhbCk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBldmVudHMgb24gdGhlIHNsaWRlciBlbGVtZW50LlxuICAgKiBDYWxjdWxhdGVzIHRoZSBuZXcgbG9jYXRpb24gb2YgdGhlIGN1cnJlbnQgaGFuZGxlLlxuICAgKiBJZiB0aGVyZSBhcmUgdHdvIGhhbmRsZXMgYW5kIHRoZSBiYXIgd2FzIGNsaWNrZWQsIGl0IGRldGVybWluZXMgd2hpY2ggaGFuZGxlIHRvIG1vdmUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gZSAtIHRoZSBgZXZlbnRgIG9iamVjdCBwYXNzZWQgZnJvbSB0aGUgbGlzdGVuZXIuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkaGFuZGxlIC0gdGhlIGN1cnJlbnQgaGFuZGxlIHRvIGNhbGN1bGF0ZSBmb3IsIGlmIHNlbGVjdGVkLlxuICAgKiBAcGFyYW0ge051bWJlcn0gdmFsIC0gZmxvYXRpbmcgcG9pbnQgbnVtYmVyIGZvciB0aGUgbmV3IHZhbHVlIG9mIHRoZSBzbGlkZXIuXG4gICAqIFRPRE8gY2xlYW4gdGhpcyB1cCwgdGhlcmUncyBhIGxvdCBvZiByZXBlYXRlZCBjb2RlIGJldHdlZW4gdGhpcyBhbmQgdGhlIF9zZXRIYW5kbGVQb3MgZm4uXG4gICAqL1xuICBfaGFuZGxlRXZlbnQoZSwgJGhhbmRsZSwgdmFsKSB7XG4gICAgdmFyIHZhbHVlLCBoYXNWYWw7XG4gICAgaWYgKCF2YWwpIHsvL2NsaWNrIG9yIGRyYWcgZXZlbnRzXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICAgIHZlcnRpY2FsID0gdGhpcy5vcHRpb25zLnZlcnRpY2FsLFxuICAgICAgICAgIHBhcmFtID0gdmVydGljYWwgPyAnaGVpZ2h0JyA6ICd3aWR0aCcsXG4gICAgICAgICAgZGlyZWN0aW9uID0gdmVydGljYWwgPyAndG9wJyA6ICdsZWZ0JyxcbiAgICAgICAgICBwYWdlWFkgPSB2ZXJ0aWNhbCA/IGUucGFnZVkgOiBlLnBhZ2VYLFxuICAgICAgICAgIGhhbGZPZkhhbmRsZSA9IHRoaXMuJGhhbmRsZVswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVtwYXJhbV0gLyAyLFxuICAgICAgICAgIGJhckRpbSA9IHRoaXMuJGVsZW1lbnRbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClbcGFyYW1dLFxuICAgICAgICAgIGJhck9mZnNldCA9ICh0aGlzLiRlbGVtZW50Lm9mZnNldCgpW2RpcmVjdGlvbl0gLSAgcGFnZVhZKSxcbiAgICAgICAgICAvL2lmIHRoZSBjdXJzb3IgcG9zaXRpb24gaXMgbGVzcyB0aGFuIG9yIGdyZWF0ZXIgdGhhbiB0aGUgZWxlbWVudHMgYm91bmRpbmcgY29vcmRpbmF0ZXMsIHNldCBjb29yZGluYXRlcyB3aXRoaW4gdGhvc2UgYm91bmRzXG4gICAgICAgICAgYmFyWFkgPSBiYXJPZmZzZXQgPiAwID8gLWhhbGZPZkhhbmRsZSA6IChiYXJPZmZzZXQgLSBoYWxmT2ZIYW5kbGUpIDwgLWJhckRpbSA/IGJhckRpbSA6IE1hdGguYWJzKGJhck9mZnNldCksXG4gICAgICAgICAgb2Zmc2V0UGN0ID0gcGVyY2VudChiYXJYWSwgYmFyRGltKTtcbiAgICAgIHZhbHVlID0gKHRoaXMub3B0aW9ucy5lbmQgLSB0aGlzLm9wdGlvbnMuc3RhcnQpICogb2Zmc2V0UGN0ICsgdGhpcy5vcHRpb25zLnN0YXJ0O1xuXG4gICAgICAvLyB0dXJuIGV2ZXJ5dGhpbmcgYXJvdW5kIGZvciBSVEwsIHlheSBtYXRoIVxuICAgICAgaWYgKEZvdW5kYXRpb24ucnRsKCkgJiYgIXRoaXMub3B0aW9ucy52ZXJ0aWNhbCkge3ZhbHVlID0gdGhpcy5vcHRpb25zLmVuZCAtIHZhbHVlO31cblxuICAgICAgdmFsdWUgPSBfdGhpcy5fYWRqdXN0VmFsdWUobnVsbCwgdmFsdWUpO1xuICAgICAgLy9ib29sZWFuIGZsYWcgZm9yIHRoZSBzZXRIYW5kbGVQb3MgZm4sIHNwZWNpZmljYWxseSBmb3IgdmVydGljYWwgc2xpZGVyc1xuICAgICAgaGFzVmFsID0gZmFsc2U7XG5cbiAgICAgIGlmICghJGhhbmRsZSkgey8vZmlndXJlIG91dCB3aGljaCBoYW5kbGUgaXQgaXMsIHBhc3MgaXQgdG8gdGhlIG5leHQgZnVuY3Rpb24uXG4gICAgICAgIHZhciBmaXJzdEhuZGxQb3MgPSBhYnNQb3NpdGlvbih0aGlzLiRoYW5kbGUsIGRpcmVjdGlvbiwgYmFyWFksIHBhcmFtKSxcbiAgICAgICAgICAgIHNlY25kSG5kbFBvcyA9IGFic1Bvc2l0aW9uKHRoaXMuJGhhbmRsZTIsIGRpcmVjdGlvbiwgYmFyWFksIHBhcmFtKTtcbiAgICAgICAgICAgICRoYW5kbGUgPSBmaXJzdEhuZGxQb3MgPD0gc2VjbmRIbmRsUG9zID8gdGhpcy4kaGFuZGxlIDogdGhpcy4kaGFuZGxlMjtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7Ly9jaGFuZ2UgZXZlbnQgb24gaW5wdXRcbiAgICAgIHZhbHVlID0gdGhpcy5fYWRqdXN0VmFsdWUobnVsbCwgdmFsKTtcbiAgICAgIGhhc1ZhbCA9IHRydWU7XG4gICAgfVxuXG4gICAgdGhpcy5fc2V0SGFuZGxlUG9zKCRoYW5kbGUsIHZhbHVlLCBoYXNWYWwpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkanVzdGVzIHZhbHVlIGZvciBoYW5kbGUgaW4gcmVnYXJkIHRvIHN0ZXAgdmFsdWUuIHJldHVybnMgYWRqdXN0ZWQgdmFsdWVcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkaGFuZGxlIC0gdGhlIHNlbGVjdGVkIGhhbmRsZS5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIC0gdmFsdWUgdG8gYWRqdXN0LiB1c2VkIGlmICRoYW5kbGUgaXMgZmFsc3lcbiAgICovXG4gIF9hZGp1c3RWYWx1ZSgkaGFuZGxlLCB2YWx1ZSkge1xuICAgIHZhciB2YWwsXG4gICAgICBzdGVwID0gdGhpcy5vcHRpb25zLnN0ZXAsXG4gICAgICBkaXYgPSBwYXJzZUZsb2F0KHN0ZXAvMiksXG4gICAgICBsZWZ0LCBwcmV2X3ZhbCwgbmV4dF92YWw7XG4gICAgaWYgKCEhJGhhbmRsZSkge1xuICAgICAgdmFsID0gcGFyc2VGbG9hdCgkaGFuZGxlLmF0dHIoJ2FyaWEtdmFsdWVub3cnKSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdmFsID0gdmFsdWU7XG4gICAgfVxuICAgIGxlZnQgPSB2YWwgJSBzdGVwO1xuICAgIHByZXZfdmFsID0gdmFsIC0gbGVmdDtcbiAgICBuZXh0X3ZhbCA9IHByZXZfdmFsICsgc3RlcDtcbiAgICBpZiAobGVmdCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHZhbDtcbiAgICB9XG4gICAgdmFsID0gdmFsID49IHByZXZfdmFsICsgZGl2ID8gbmV4dF92YWwgOiBwcmV2X3ZhbDtcbiAgICByZXR1cm4gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIHRoZSBzbGlkZXIgZWxlbWVudHMuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGhhbmRsZSAtIHRoZSBjdXJyZW50IGhhbmRsZSB0byBhcHBseSBsaXN0ZW5lcnMgdG8uXG4gICAqL1xuICBfZXZlbnRzKCRoYW5kbGUpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmRpc2FibGVkKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgdmFyIF90aGlzID0gdGhpcyxcbiAgICAgICAgY3VySGFuZGxlLFxuICAgICAgICB0aW1lcjtcblxuICAgICAgdGhpcy5pbnB1dHMub2ZmKCdjaGFuZ2UuemYuc2xpZGVyJykub24oJ2NoYW5nZS56Zi5zbGlkZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBpZHggPSBfdGhpcy5pbnB1dHMuaW5kZXgoJCh0aGlzKSk7XG4gICAgICAgIF90aGlzLl9oYW5kbGVFdmVudChlLCBfdGhpcy5oYW5kbGVzLmVxKGlkeCksICQodGhpcykudmFsKCkpO1xuICAgICAgfSk7XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuY2xpY2tTZWxlY3QpIHtcbiAgICAgICAgdGhpcy4kZWxlbWVudC5vZmYoJ2NsaWNrLnpmLnNsaWRlcicpLm9uKCdjbGljay56Zi5zbGlkZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgaWYgKF90aGlzLiRlbGVtZW50LmRhdGEoJ2RyYWdnaW5nJykpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICAgICAgICBpZiAoISQoZS50YXJnZXQpLmlzKCdbZGF0YS1zbGlkZXItaGFuZGxlXScpKSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy5kb3VibGVTaWRlZCkge1xuICAgICAgICAgICAgICBfdGhpcy5faGFuZGxlRXZlbnQoZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBfdGhpcy5faGFuZGxlRXZlbnQoZSwgX3RoaXMuJGhhbmRsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuZHJhZ2dhYmxlKSB7XG4gICAgICB0aGlzLmhhbmRsZXMuYWRkVG91Y2goKTtcblxuICAgICAgdmFyICRib2R5ID0gJCgnYm9keScpO1xuICAgICAgJGhhbmRsZVxuICAgICAgICAub2ZmKCdtb3VzZWRvd24uemYuc2xpZGVyJylcbiAgICAgICAgLm9uKCdtb3VzZWRvd24uemYuc2xpZGVyJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICRoYW5kbGUuYWRkQ2xhc3MoJ2lzLWRyYWdnaW5nJyk7XG4gICAgICAgICAgX3RoaXMuJGZpbGwuYWRkQ2xhc3MoJ2lzLWRyYWdnaW5nJyk7Ly9cbiAgICAgICAgICBfdGhpcy4kZWxlbWVudC5kYXRhKCdkcmFnZ2luZycsIHRydWUpO1xuXG4gICAgICAgICAgY3VySGFuZGxlID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuXG4gICAgICAgICAgJGJvZHkub24oJ21vdXNlbW92ZS56Zi5zbGlkZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIF90aGlzLl9oYW5kbGVFdmVudChlLCBjdXJIYW5kbGUpO1xuXG4gICAgICAgICAgfSkub24oJ21vdXNldXAuemYuc2xpZGVyJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgX3RoaXMuX2hhbmRsZUV2ZW50KGUsIGN1ckhhbmRsZSk7XG5cbiAgICAgICAgICAgICRoYW5kbGUucmVtb3ZlQ2xhc3MoJ2lzLWRyYWdnaW5nJyk7XG4gICAgICAgICAgICBfdGhpcy4kZmlsbC5yZW1vdmVDbGFzcygnaXMtZHJhZ2dpbmcnKTtcbiAgICAgICAgICAgIF90aGlzLiRlbGVtZW50LmRhdGEoJ2RyYWdnaW5nJywgZmFsc2UpO1xuXG4gICAgICAgICAgICAkYm9keS5vZmYoJ21vdXNlbW92ZS56Zi5zbGlkZXIgbW91c2V1cC56Zi5zbGlkZXInKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgICRoYW5kbGUub2ZmKCdrZXlkb3duLnpmLnNsaWRlcicpLm9uKCdrZXlkb3duLnpmLnNsaWRlcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBfJGhhbmRsZSA9ICQodGhpcyksXG4gICAgICAgICAgaWR4ID0gX3RoaXMub3B0aW9ucy5kb3VibGVTaWRlZCA/IF90aGlzLmhhbmRsZXMuaW5kZXgoXyRoYW5kbGUpIDogMCxcbiAgICAgICAgICBvbGRWYWx1ZSA9IHBhcnNlRmxvYXQoX3RoaXMuaW5wdXRzLmVxKGlkeCkudmFsKCkpLFxuICAgICAgICAgIG5ld1ZhbHVlO1xuXG4gICAgICAvLyBoYW5kbGUga2V5Ym9hcmQgZXZlbnQgd2l0aCBrZXlib2FyZCB1dGlsXG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnU2xpZGVyJywge1xuICAgICAgICBkZWNyZWFzZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbmV3VmFsdWUgPSBvbGRWYWx1ZSAtIF90aGlzLm9wdGlvbnMuc3RlcDtcbiAgICAgICAgfSxcbiAgICAgICAgaW5jcmVhc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIG5ld1ZhbHVlID0gb2xkVmFsdWUgKyBfdGhpcy5vcHRpb25zLnN0ZXA7XG4gICAgICAgIH0sXG4gICAgICAgIGRlY3JlYXNlX2Zhc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIG5ld1ZhbHVlID0gb2xkVmFsdWUgLSBfdGhpcy5vcHRpb25zLnN0ZXAgKiAxMDtcbiAgICAgICAgfSxcbiAgICAgICAgaW5jcmVhc2VfZmFzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbmV3VmFsdWUgPSBvbGRWYWx1ZSArIF90aGlzLm9wdGlvbnMuc3RlcCAqIDEwO1xuICAgICAgICB9LFxuICAgICAgICBoYW5kbGVkOiBmdW5jdGlvbigpIHsgLy8gb25seSBzZXQgaGFuZGxlIHBvcyB3aGVuIGV2ZW50IHdhcyBoYW5kbGVkIHNwZWNpYWxseVxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBfdGhpcy5fc2V0SGFuZGxlUG9zKF8kaGFuZGxlLCBuZXdWYWx1ZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLyppZiAobmV3VmFsdWUpIHsgLy8gaWYgcHJlc3NlZCBrZXkgaGFzIHNwZWNpYWwgZnVuY3Rpb24sIHVwZGF0ZSB2YWx1ZVxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIF90aGlzLl9zZXRIYW5kbGVQb3MoXyRoYW5kbGUsIG5ld1ZhbHVlKTtcbiAgICAgIH0qL1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBzbGlkZXIgcGx1Z2luLlxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmhhbmRsZXMub2ZmKCcuemYuc2xpZGVyJyk7XG4gICAgdGhpcy5pbnB1dHMub2ZmKCcuemYuc2xpZGVyJyk7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi5zbGlkZXInKTtcblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG5TbGlkZXIuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBNaW5pbXVtIHZhbHVlIGZvciB0aGUgc2xpZGVyIHNjYWxlLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDBcbiAgICovXG4gIHN0YXJ0OiAwLFxuICAvKipcbiAgICogTWF4aW11bSB2YWx1ZSBmb3IgdGhlIHNsaWRlciBzY2FsZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAxMDBcbiAgICovXG4gIGVuZDogMTAwLFxuICAvKipcbiAgICogTWluaW11bSB2YWx1ZSBjaGFuZ2UgcGVyIGNoYW5nZSBldmVudC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAxXG4gICAqL1xuICBzdGVwOiAxLFxuICAvKipcbiAgICogVmFsdWUgYXQgd2hpY2ggdGhlIGhhbmRsZS9pbnB1dCAqKGxlZnQgaGFuZGxlL2ZpcnN0IGlucHV0KSogc2hvdWxkIGJlIHNldCB0byBvbiBpbml0aWFsaXphdGlvbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAwXG4gICAqL1xuICBpbml0aWFsU3RhcnQ6IDAsXG4gIC8qKlxuICAgKiBWYWx1ZSBhdCB3aGljaCB0aGUgcmlnaHQgaGFuZGxlL3NlY29uZCBpbnB1dCBzaG91bGQgYmUgc2V0IHRvIG9uIGluaXRpYWxpemF0aW9uLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDEwMFxuICAgKi9cbiAgaW5pdGlhbEVuZDogMTAwLFxuICAvKipcbiAgICogQWxsb3dzIHRoZSBpbnB1dCB0byBiZSBsb2NhdGVkIG91dHNpZGUgdGhlIGNvbnRhaW5lciBhbmQgdmlzaWJsZS4gU2V0IHRvIGJ5IHRoZSBKU1xuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBiaW5kaW5nOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgdXNlciB0byBjbGljay90YXAgb24gdGhlIHNsaWRlciBiYXIgdG8gc2VsZWN0IGEgdmFsdWUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgY2xpY2tTZWxlY3Q6IHRydWUsXG4gIC8qKlxuICAgKiBTZXQgdG8gdHJ1ZSBhbmQgdXNlIHRoZSBgdmVydGljYWxgIGNsYXNzIHRvIGNoYW5nZSBhbGlnbm1lbnQgdG8gdmVydGljYWwuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIHZlcnRpY2FsOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgdXNlciB0byBkcmFnIHRoZSBzbGlkZXIgaGFuZGxlKHMpIHRvIHNlbGVjdCBhIHZhbHVlLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGRyYWdnYWJsZTogdHJ1ZSxcbiAgLyoqXG4gICAqIERpc2FibGVzIHRoZSBzbGlkZXIgYW5kIHByZXZlbnRzIGV2ZW50IGxpc3RlbmVycyBmcm9tIGJlaW5nIGFwcGxpZWQuIERvdWJsZSBjaGVja2VkIGJ5IEpTIHdpdGggYGRpc2FibGVkQ2xhc3NgLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBkaXNhYmxlZDogZmFsc2UsXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIHVzZSBvZiB0d28gaGFuZGxlcy4gRG91YmxlIGNoZWNrZWQgYnkgdGhlIEpTLiBDaGFuZ2VzIHNvbWUgbG9naWMgaGFuZGxpbmcuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGRvdWJsZVNpZGVkOiBmYWxzZSxcbiAgLyoqXG4gICAqIFBvdGVudGlhbCBmdXR1cmUgZmVhdHVyZS5cbiAgICovXG4gIC8vIHN0ZXBzOiAxMDAsXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgZGVjaW1hbCBwbGFjZXMgdGhlIHBsdWdpbiBzaG91bGQgZ28gdG8gZm9yIGZsb2F0aW5nIHBvaW50IHByZWNpc2lvbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAyXG4gICAqL1xuICBkZWNpbWFsOiAyLFxuICAvKipcbiAgICogVGltZSBkZWxheSBmb3IgZHJhZ2dlZCBlbGVtZW50cy5cbiAgICovXG4gIC8vIGRyYWdEZWxheTogMCxcbiAgLyoqXG4gICAqIFRpbWUsIGluIG1zLCB0byBhbmltYXRlIHRoZSBtb3ZlbWVudCBvZiBhIHNsaWRlciBoYW5kbGUgaWYgdXNlciBjbGlja3MvdGFwcyBvbiB0aGUgYmFyLiBOZWVkcyB0byBiZSBtYW51YWxseSBzZXQgaWYgdXBkYXRpbmcgdGhlIHRyYW5zaXRpb24gdGltZSBpbiB0aGUgU2FzcyBzZXR0aW5ncy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAyMDBcbiAgICovXG4gIG1vdmVUaW1lOiAyMDAsLy91cGRhdGUgdGhpcyBpZiBjaGFuZ2luZyB0aGUgdHJhbnNpdGlvbiB0aW1lIGluIHRoZSBzYXNzXG4gIC8qKlxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIGRpc2FibGVkIHNsaWRlcnMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ2Rpc2FibGVkJ1xuICAgKi9cbiAgZGlzYWJsZWRDbGFzczogJ2Rpc2FibGVkJyxcbiAgLyoqXG4gICAqIFdpbGwgaW52ZXJ0IHRoZSBkZWZhdWx0IGxheW91dCBmb3IgYSB2ZXJ0aWNhbDxzcGFuIGRhdGEtdG9vbHRpcCB0aXRsZT1cIndobyB3b3VsZCBkbyB0aGlzPz8/XCI+IDwvc3Bhbj5zbGlkZXIuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGludmVydFZlcnRpY2FsOiBmYWxzZSxcbiAgLyoqXG4gICAqIE1pbGxpc2Vjb25kcyBiZWZvcmUgdGhlIGBjaGFuZ2VkLnpmLXNsaWRlcmAgZXZlbnQgaXMgdHJpZ2dlcmVkIGFmdGVyIHZhbHVlIGNoYW5nZS4gXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgNTAwXG4gICAqL1xuICBjaGFuZ2VkRGVsYXk6IDUwMFxufTtcblxuZnVuY3Rpb24gcGVyY2VudChmcmFjLCBudW0pIHtcbiAgcmV0dXJuIChmcmFjIC8gbnVtKTtcbn1cbmZ1bmN0aW9uIGFic1Bvc2l0aW9uKCRoYW5kbGUsIGRpciwgY2xpY2tQb3MsIHBhcmFtKSB7XG4gIHJldHVybiBNYXRoLmFicygoJGhhbmRsZS5wb3NpdGlvbigpW2Rpcl0gKyAoJGhhbmRsZVtwYXJhbV0oKSAvIDIpKSAtIGNsaWNrUG9zKTtcbn1cblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKFNsaWRlciwgJ1NsaWRlcicpO1xuXG59KGpRdWVyeSk7XG5cbi8vKioqKioqKioqdGhpcyBpcyBpbiBjYXNlIHdlIGdvIHRvIHN0YXRpYywgYWJzb2x1dGUgcG9zaXRpb25zIGluc3RlYWQgb2YgZHluYW1pYyBwb3NpdGlvbmluZyoqKioqKioqXG4vLyB0aGlzLnNldFN0ZXBzKGZ1bmN0aW9uKCkge1xuLy8gICBfdGhpcy5fZXZlbnRzKCk7XG4vLyAgIHZhciBpbml0U3RhcnQgPSBfdGhpcy5vcHRpb25zLnBvc2l0aW9uc1tfdGhpcy5vcHRpb25zLmluaXRpYWxTdGFydCAtIDFdIHx8IG51bGw7XG4vLyAgIHZhciBpbml0RW5kID0gX3RoaXMub3B0aW9ucy5pbml0aWFsRW5kID8gX3RoaXMub3B0aW9ucy5wb3NpdGlvbltfdGhpcy5vcHRpb25zLmluaXRpYWxFbmQgLSAxXSA6IG51bGw7XG4vLyAgIGlmIChpbml0U3RhcnQgfHwgaW5pdEVuZCkge1xuLy8gICAgIF90aGlzLl9oYW5kbGVFdmVudChpbml0U3RhcnQsIGluaXRFbmQpO1xuLy8gICB9XG4vLyB9KTtcblxuLy8qKioqKioqKioqKnRoZSBvdGhlciBwYXJ0IG9mIGFic29sdXRlIHBvc2l0aW9ucyoqKioqKioqKioqKipcbi8vIFNsaWRlci5wcm90b3R5cGUuc2V0U3RlcHMgPSBmdW5jdGlvbihjYikge1xuLy8gICB2YXIgcG9zQ2hhbmdlID0gdGhpcy4kZWxlbWVudC5vdXRlcldpZHRoKCkgLyB0aGlzLm9wdGlvbnMuc3RlcHM7XG4vLyAgIHZhciBjb3VudGVyID0gMFxuLy8gICB3aGlsZShjb3VudGVyIDwgdGhpcy5vcHRpb25zLnN0ZXBzKSB7XG4vLyAgICAgaWYgKGNvdW50ZXIpIHtcbi8vICAgICAgIHRoaXMub3B0aW9ucy5wb3NpdGlvbnMucHVzaCh0aGlzLm9wdGlvbnMucG9zaXRpb25zW2NvdW50ZXIgLSAxXSArIHBvc0NoYW5nZSk7XG4vLyAgICAgfSBlbHNlIHtcbi8vICAgICAgIHRoaXMub3B0aW9ucy5wb3NpdGlvbnMucHVzaChwb3NDaGFuZ2UpO1xuLy8gICAgIH1cbi8vICAgICBjb3VudGVyKys7XG4vLyAgIH1cbi8vICAgY2IoKTtcbi8vIH07XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogU3RpY2t5IG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5zdGlja3lcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICovXG5cbmNsYXNzIFN0aWNreSB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGEgc3RpY2t5IHRoaW5nLlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2Ugc3RpY2t5LlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIG9wdGlvbnMgb2JqZWN0IHBhc3NlZCB3aGVuIGNyZWF0aW5nIHRoZSBlbGVtZW50IHByb2dyYW1tYXRpY2FsbHkuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIFN0aWNreS5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnU3RpY2t5Jyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHN0aWNreSBlbGVtZW50IGJ5IGFkZGluZyBjbGFzc2VzLCBnZXR0aW5nL3NldHRpbmcgZGltZW5zaW9ucywgYnJlYWtwb2ludHMgYW5kIGF0dHJpYnV0ZXNcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgJHBhcmVudCA9IHRoaXMuJGVsZW1lbnQucGFyZW50KCdbZGF0YS1zdGlja3ktY29udGFpbmVyXScpLFxuICAgICAgICBpZCA9IHRoaXMuJGVsZW1lbnRbMF0uaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnc3RpY2t5JyksXG4gICAgICAgIF90aGlzID0gdGhpcztcblxuICAgIGlmICghJHBhcmVudC5sZW5ndGgpIHtcbiAgICAgIHRoaXMud2FzV3JhcHBlZCA9IHRydWU7XG4gICAgfVxuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRwYXJlbnQubGVuZ3RoID8gJHBhcmVudCA6ICQodGhpcy5vcHRpb25zLmNvbnRhaW5lcikud3JhcElubmVyKHRoaXMuJGVsZW1lbnQpO1xuICAgIHRoaXMuJGNvbnRhaW5lci5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuY29udGFpbmVyQ2xhc3MpO1xuXG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuc3RpY2t5Q2xhc3MpXG4gICAgICAgICAgICAgICAgIC5hdHRyKHsnZGF0YS1yZXNpemUnOiBpZH0pO1xuXG4gICAgdGhpcy5zY3JvbGxDb3VudCA9IHRoaXMub3B0aW9ucy5jaGVja0V2ZXJ5O1xuICAgIHRoaXMuaXNTdHVjayA9IGZhbHNlO1xuICAgICQod2luZG93KS5vbmUoJ2xvYWQuemYuc3RpY2t5JywgZnVuY3Rpb24oKXtcbiAgICAgIGlmKF90aGlzLm9wdGlvbnMuYW5jaG9yICE9PSAnJyl7XG4gICAgICAgIF90aGlzLiRhbmNob3IgPSAkKCcjJyArIF90aGlzLm9wdGlvbnMuYW5jaG9yKTtcbiAgICAgIH1lbHNle1xuICAgICAgICBfdGhpcy5fcGFyc2VQb2ludHMoKTtcbiAgICAgIH1cblxuICAgICAgX3RoaXMuX3NldFNpemVzKGZ1bmN0aW9uKCl7XG4gICAgICAgIF90aGlzLl9jYWxjKGZhbHNlKTtcbiAgICAgIH0pO1xuICAgICAgX3RoaXMuX2V2ZW50cyhpZC5zcGxpdCgnLScpLnJldmVyc2UoKS5qb2luKCctJykpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIElmIHVzaW5nIG11bHRpcGxlIGVsZW1lbnRzIGFzIGFuY2hvcnMsIGNhbGN1bGF0ZXMgdGhlIHRvcCBhbmQgYm90dG9tIHBpeGVsIHZhbHVlcyB0aGUgc3RpY2t5IHRoaW5nIHNob3VsZCBzdGljayBhbmQgdW5zdGljayBvbi5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfcGFyc2VQb2ludHMoKSB7XG4gICAgdmFyIHRvcCA9IHRoaXMub3B0aW9ucy50b3BBbmNob3IsXG4gICAgICAgIGJ0bSA9IHRoaXMub3B0aW9ucy5idG1BbmNob3IsXG4gICAgICAgIHB0cyA9IFt0b3AsIGJ0bV0sXG4gICAgICAgIGJyZWFrcyA9IHt9O1xuICAgIGlmICh0b3AgJiYgYnRtKSB7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBwdHMubGVuZ3RoOyBpIDwgbGVuICYmIHB0c1tpXTsgaSsrKSB7XG4gICAgICAgIHZhciBwdDtcbiAgICAgICAgaWYgKHR5cGVvZiBwdHNbaV0gPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgcHQgPSBwdHNbaV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIHBsYWNlID0gcHRzW2ldLnNwbGl0KCc6JyksXG4gICAgICAgICAgICAgIGFuY2hvciA9ICQoYCMke3BsYWNlWzBdfWApO1xuXG4gICAgICAgICAgcHQgPSBhbmNob3Iub2Zmc2V0KCkudG9wO1xuICAgICAgICAgIGlmIChwbGFjZVsxXSAmJiBwbGFjZVsxXS50b0xvd2VyQ2FzZSgpID09PSAnYm90dG9tJykge1xuICAgICAgICAgICAgcHQgKz0gYW5jaG9yWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtzW2ldID0gcHQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrcyA9IHswOiAxLCAxOiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsSGVpZ2h0fTtcbiAgICB9XG5cbiAgICB0aGlzLnBvaW50cyA9IGJyZWFrcztcbiAgICByZXR1cm47XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyBmb3IgdGhlIHNjcm9sbGluZyBlbGVtZW50LlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgLSBwc3VlZG8tcmFuZG9tIGlkIGZvciB1bmlxdWUgc2Nyb2xsIGV2ZW50IGxpc3RlbmVyLlxuICAgKi9cbiAgX2V2ZW50cyhpZCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICAgIHNjcm9sbExpc3RlbmVyID0gdGhpcy5zY3JvbGxMaXN0ZW5lciA9IGBzY3JvbGwuemYuJHtpZH1gO1xuICAgIGlmICh0aGlzLmlzT24pIHsgcmV0dXJuOyB9XG4gICAgaWYgKHRoaXMuY2FuU3RpY2spIHtcbiAgICAgIHRoaXMuaXNPbiA9IHRydWU7XG4gICAgICAkKHdpbmRvdykub2ZmKHNjcm9sbExpc3RlbmVyKVxuICAgICAgICAgICAgICAgLm9uKHNjcm9sbExpc3RlbmVyLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgIGlmIChfdGhpcy5zY3JvbGxDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgIF90aGlzLnNjcm9sbENvdW50ID0gX3RoaXMub3B0aW9ucy5jaGVja0V2ZXJ5O1xuICAgICAgICAgICAgICAgICAgIF90aGlzLl9zZXRTaXplcyhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgIF90aGlzLl9jYWxjKGZhbHNlLCB3aW5kb3cucGFnZVlPZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgIF90aGlzLnNjcm9sbENvdW50LS07XG4gICAgICAgICAgICAgICAgICAgX3RoaXMuX2NhbGMoZmFsc2UsIHdpbmRvdy5wYWdlWU9mZnNldCk7XG4gICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInKVxuICAgICAgICAgICAgICAgICAub24oJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInLCBmdW5jdGlvbihlLCBlbCkge1xuICAgICAgICAgICAgICAgICAgICAgX3RoaXMuX3NldFNpemVzKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5fY2FsYyhmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgIGlmIChfdGhpcy5jYW5TdGljaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghX3RoaXMuaXNPbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuX2V2ZW50cyhpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKF90aGlzLmlzT24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5fcGF1c2VMaXN0ZW5lcnMoc2Nyb2xsTGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGV2ZW50IGhhbmRsZXJzIGZvciBzY3JvbGwgYW5kIGNoYW5nZSBldmVudHMgb24gYW5jaG9yLlxuICAgKiBAZmlyZXMgU3RpY2t5I3BhdXNlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzY3JvbGxMaXN0ZW5lciAtIHVuaXF1ZSwgbmFtZXNwYWNlZCBzY3JvbGwgbGlzdGVuZXIgYXR0YWNoZWQgdG8gYHdpbmRvd2BcbiAgICovXG4gIF9wYXVzZUxpc3RlbmVycyhzY3JvbGxMaXN0ZW5lcikge1xuICAgIHRoaXMuaXNPbiA9IGZhbHNlO1xuICAgICQod2luZG93KS5vZmYoc2Nyb2xsTGlzdGVuZXIpO1xuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGlzIHBhdXNlZCBkdWUgdG8gcmVzaXplIGV2ZW50IHNocmlua2luZyB0aGUgdmlldy5cbiAgICAgKiBAZXZlbnQgU3RpY2t5I3BhdXNlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwYXVzZS56Zi5zdGlja3knKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgb24gZXZlcnkgYHNjcm9sbGAgZXZlbnQgYW5kIG9uIGBfaW5pdGBcbiAgICogZmlyZXMgZnVuY3Rpb25zIGJhc2VkIG9uIGJvb2xlYW5zIGFuZCBjYWNoZWQgdmFsdWVzXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gY2hlY2tTaXplcyAtIHRydWUgaWYgcGx1Z2luIHNob3VsZCByZWNhbGN1bGF0ZSBzaXplcyBhbmQgYnJlYWtwb2ludHMuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBzY3JvbGwgLSBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbiBwYXNzZWQgZnJvbSBzY3JvbGwgZXZlbnQgY2IgZnVuY3Rpb24uIElmIG5vdCBwYXNzZWQsIGRlZmF1bHRzIHRvIGB3aW5kb3cucGFnZVlPZmZzZXRgLlxuICAgKi9cbiAgX2NhbGMoY2hlY2tTaXplcywgc2Nyb2xsKSB7XG4gICAgaWYgKGNoZWNrU2l6ZXMpIHsgdGhpcy5fc2V0U2l6ZXMoKTsgfVxuXG4gICAgaWYgKCF0aGlzLmNhblN0aWNrKSB7XG4gICAgICBpZiAodGhpcy5pc1N0dWNrKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZVN0aWNreSh0cnVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIXNjcm9sbCkgeyBzY3JvbGwgPSB3aW5kb3cucGFnZVlPZmZzZXQ7IH1cblxuICAgIGlmIChzY3JvbGwgPj0gdGhpcy50b3BQb2ludCkge1xuICAgICAgaWYgKHNjcm9sbCA8PSB0aGlzLmJvdHRvbVBvaW50KSB7XG4gICAgICAgIGlmICghdGhpcy5pc1N0dWNrKSB7XG4gICAgICAgICAgdGhpcy5fc2V0U3RpY2t5KCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLmlzU3R1Y2spIHtcbiAgICAgICAgICB0aGlzLl9yZW1vdmVTdGlja3koZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLmlzU3R1Y2spIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlU3RpY2t5KHRydWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYXVzZXMgdGhlICRlbGVtZW50IHRvIGJlY29tZSBzdHVjay5cbiAgICogQWRkcyBgcG9zaXRpb246IGZpeGVkO2AsIGFuZCBoZWxwZXIgY2xhc3Nlcy5cbiAgICogQGZpcmVzIFN0aWNreSNzdHVja3RvXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3NldFN0aWNreSgpIHtcbiAgICB2YXIgc3RpY2tUbyA9IHRoaXMub3B0aW9ucy5zdGlja1RvLFxuICAgICAgICBtcmduID0gc3RpY2tUbyA9PT0gJ3RvcCcgPyAnbWFyZ2luVG9wJyA6ICdtYXJnaW5Cb3R0b20nLFxuICAgICAgICBub3RTdHVja1RvID0gc3RpY2tUbyA9PT0gJ3RvcCcgPyAnYm90dG9tJyA6ICd0b3AnLFxuICAgICAgICBjc3MgPSB7fTtcblxuICAgIGNzc1ttcmduXSA9IGAke3RoaXMub3B0aW9uc1ttcmduXX1lbWA7XG4gICAgY3NzW3N0aWNrVG9dID0gMDtcbiAgICBjc3Nbbm90U3R1Y2tUb10gPSAnYXV0byc7XG4gICAgY3NzWydsZWZ0J10gPSB0aGlzLiRjb250YWluZXIub2Zmc2V0KCkubGVmdCArIHBhcnNlSW50KHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRoaXMuJGNvbnRhaW5lclswXSlbXCJwYWRkaW5nLWxlZnRcIl0sIDEwKTtcbiAgICB0aGlzLmlzU3R1Y2sgPSB0cnVlO1xuICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoYGlzLWFuY2hvcmVkIGlzLWF0LSR7bm90U3R1Y2tUb31gKVxuICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoYGlzLXN0dWNrIGlzLWF0LSR7c3RpY2tUb31gKVxuICAgICAgICAgICAgICAgICAuY3NzKGNzcylcbiAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlICRlbGVtZW50IGhhcyBiZWNvbWUgYHBvc2l0aW9uOiBmaXhlZDtgXG4gICAgICAgICAgICAgICAgICAqIE5hbWVzcGFjZWQgdG8gYHRvcGAgb3IgYGJvdHRvbWAsIGUuZy4gYHN0aWNreS56Zi5zdHVja3RvOnRvcGBcbiAgICAgICAgICAgICAgICAgICogQGV2ZW50IFN0aWNreSNzdHVja3RvXG4gICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAudHJpZ2dlcihgc3RpY2t5LnpmLnN0dWNrdG86JHtzdGlja1RvfWApO1xuICB9XG5cbiAgLyoqXG4gICAqIENhdXNlcyB0aGUgJGVsZW1lbnQgdG8gYmVjb21lIHVuc3R1Y2suXG4gICAqIFJlbW92ZXMgYHBvc2l0aW9uOiBmaXhlZDtgLCBhbmQgaGVscGVyIGNsYXNzZXMuXG4gICAqIEFkZHMgb3RoZXIgaGVscGVyIGNsYXNzZXMuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNUb3AgLSB0ZWxscyB0aGUgZnVuY3Rpb24gaWYgdGhlICRlbGVtZW50IHNob3VsZCBhbmNob3IgdG8gdGhlIHRvcCBvciBib3R0b20gb2YgaXRzICRhbmNob3IgZWxlbWVudC5cbiAgICogQGZpcmVzIFN0aWNreSN1bnN0dWNrZnJvbVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3JlbW92ZVN0aWNreShpc1RvcCkge1xuICAgIHZhciBzdGlja1RvID0gdGhpcy5vcHRpb25zLnN0aWNrVG8sXG4gICAgICAgIHN0aWNrVG9Ub3AgPSBzdGlja1RvID09PSAndG9wJyxcbiAgICAgICAgY3NzID0ge30sXG4gICAgICAgIGFuY2hvclB0ID0gKHRoaXMucG9pbnRzID8gdGhpcy5wb2ludHNbMV0gLSB0aGlzLnBvaW50c1swXSA6IHRoaXMuYW5jaG9ySGVpZ2h0KSAtIHRoaXMuZWxlbUhlaWdodCxcbiAgICAgICAgbXJnbiA9IHN0aWNrVG9Ub3AgPyAnbWFyZ2luVG9wJyA6ICdtYXJnaW5Cb3R0b20nLFxuICAgICAgICBub3RTdHVja1RvID0gc3RpY2tUb1RvcCA/ICdib3R0b20nIDogJ3RvcCcsXG4gICAgICAgIHRvcE9yQm90dG9tID0gaXNUb3AgPyAndG9wJyA6ICdib3R0b20nO1xuXG4gICAgY3NzW21yZ25dID0gMDtcblxuICAgIGlmICgoaXNUb3AgJiYgIXN0aWNrVG9Ub3ApIHx8IChzdGlja1RvVG9wICYmICFpc1RvcCkpIHtcbiAgICAgIGNzc1tzdGlja1RvXSA9IGFuY2hvclB0O1xuICAgICAgY3NzW25vdFN0dWNrVG9dID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgY3NzW3N0aWNrVG9dID0gMDtcbiAgICAgIGNzc1tub3RTdHVja1RvXSA9IGFuY2hvclB0O1xuICAgIH1cblxuICAgIGNzc1snbGVmdCddID0gJyc7XG4gICAgdGhpcy5pc1N0dWNrID0gZmFsc2U7XG4gICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhgaXMtc3R1Y2sgaXMtYXQtJHtzdGlja1RvfWApXG4gICAgICAgICAgICAgICAgIC5hZGRDbGFzcyhgaXMtYW5jaG9yZWQgaXMtYXQtJHt0b3BPckJvdHRvbX1gKVxuICAgICAgICAgICAgICAgICAuY3NzKGNzcylcbiAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlICRlbGVtZW50IGhhcyBiZWNvbWUgYW5jaG9yZWQuXG4gICAgICAgICAgICAgICAgICAqIE5hbWVzcGFjZWQgdG8gYHRvcGAgb3IgYGJvdHRvbWAsIGUuZy4gYHN0aWNreS56Zi51bnN0dWNrZnJvbTpib3R0b21gXG4gICAgICAgICAgICAgICAgICAqIEBldmVudCBTdGlja3kjdW5zdHVja2Zyb21cbiAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgIC50cmlnZ2VyKGBzdGlja3kuemYudW5zdHVja2Zyb206JHt0b3BPckJvdHRvbX1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSAkZWxlbWVudCBhbmQgJGNvbnRhaW5lciBzaXplcyBmb3IgcGx1Z2luLlxuICAgKiBDYWxscyBgX3NldEJyZWFrUG9pbnRzYC5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbiB0byBmaXJlIG9uIGNvbXBsZXRpb24gb2YgYF9zZXRCcmVha1BvaW50c2AuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0U2l6ZXMoY2IpIHtcbiAgICB0aGlzLmNhblN0aWNrID0gRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QodGhpcy5vcHRpb25zLnN0aWNreU9uKTtcbiAgICBpZiAoIXRoaXMuY2FuU3RpY2spIHsgY2IoKTsgfVxuICAgIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICAgIG5ld0VsZW1XaWR0aCA9IHRoaXMuJGNvbnRhaW5lclswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aCxcbiAgICAgICAgY29tcCA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRoaXMuJGNvbnRhaW5lclswXSksXG4gICAgICAgIHBkbmcgPSBwYXJzZUludChjb21wWydwYWRkaW5nLXJpZ2h0J10sIDEwKTtcblxuICAgIGlmICh0aGlzLiRhbmNob3IgJiYgdGhpcy4kYW5jaG9yLmxlbmd0aCkge1xuICAgICAgdGhpcy5hbmNob3JIZWlnaHQgPSB0aGlzLiRhbmNob3JbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9wYXJzZVBvaW50cygpO1xuICAgIH1cblxuICAgIHRoaXMuJGVsZW1lbnQuY3NzKHtcbiAgICAgICdtYXgtd2lkdGgnOiBgJHtuZXdFbGVtV2lkdGggLSBwZG5nfXB4YFxuICAgIH0pO1xuXG4gICAgdmFyIG5ld0NvbnRhaW5lckhlaWdodCA9IHRoaXMuJGVsZW1lbnRbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0IHx8IHRoaXMuY29udGFpbmVySGVpZ2h0O1xuICAgIHRoaXMuY29udGFpbmVySGVpZ2h0ID0gbmV3Q29udGFpbmVySGVpZ2h0O1xuICAgIHRoaXMuJGNvbnRhaW5lci5jc3Moe1xuICAgICAgaGVpZ2h0OiBuZXdDb250YWluZXJIZWlnaHRcbiAgICB9KTtcbiAgICB0aGlzLmVsZW1IZWlnaHQgPSBuZXdDb250YWluZXJIZWlnaHQ7XG5cbiAgXHRpZiAodGhpcy5pc1N0dWNrKSB7XG4gIFx0XHR0aGlzLiRlbGVtZW50LmNzcyh7XCJsZWZ0XCI6dGhpcy4kY29udGFpbmVyLm9mZnNldCgpLmxlZnQgKyBwYXJzZUludChjb21wWydwYWRkaW5nLWxlZnQnXSwgMTApfSk7XG4gIFx0fVxuXG4gICAgdGhpcy5fc2V0QnJlYWtQb2ludHMobmV3Q29udGFpbmVySGVpZ2h0LCBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChjYikgeyBjYigpOyB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdXBwZXIgYW5kIGxvd2VyIGJyZWFrcG9pbnRzIGZvciB0aGUgZWxlbWVudCB0byBiZWNvbWUgc3RpY2t5L3Vuc3RpY2t5LlxuICAgKiBAcGFyYW0ge051bWJlcn0gZWxlbUhlaWdodCAtIHB4IHZhbHVlIGZvciBzdGlja3kuJGVsZW1lbnQgaGVpZ2h0LCBjYWxjdWxhdGVkIGJ5IGBfc2V0U2l6ZXNgLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIG9wdGlvbmFsIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiBjb21wbGV0aW9uLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3NldEJyZWFrUG9pbnRzKGVsZW1IZWlnaHQsIGNiKSB7XG4gICAgaWYgKCF0aGlzLmNhblN0aWNrKSB7XG4gICAgICBpZiAoY2IpIHsgY2IoKTsgfVxuICAgICAgZWxzZSB7IHJldHVybiBmYWxzZTsgfVxuICAgIH1cbiAgICB2YXIgbVRvcCA9IGVtQ2FsYyh0aGlzLm9wdGlvbnMubWFyZ2luVG9wKSxcbiAgICAgICAgbUJ0bSA9IGVtQ2FsYyh0aGlzLm9wdGlvbnMubWFyZ2luQm90dG9tKSxcbiAgICAgICAgdG9wUG9pbnQgPSB0aGlzLnBvaW50cyA/IHRoaXMucG9pbnRzWzBdIDogdGhpcy4kYW5jaG9yLm9mZnNldCgpLnRvcCxcbiAgICAgICAgYm90dG9tUG9pbnQgPSB0aGlzLnBvaW50cyA/IHRoaXMucG9pbnRzWzFdIDogdG9wUG9pbnQgKyB0aGlzLmFuY2hvckhlaWdodCxcbiAgICAgICAgLy8gdG9wUG9pbnQgPSB0aGlzLiRhbmNob3Iub2Zmc2V0KCkudG9wIHx8IHRoaXMucG9pbnRzWzBdLFxuICAgICAgICAvLyBib3R0b21Qb2ludCA9IHRvcFBvaW50ICsgdGhpcy5hbmNob3JIZWlnaHQgfHwgdGhpcy5wb2ludHNbMV0sXG4gICAgICAgIHdpbkhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuc3RpY2tUbyA9PT0gJ3RvcCcpIHtcbiAgICAgIHRvcFBvaW50IC09IG1Ub3A7XG4gICAgICBib3R0b21Qb2ludCAtPSAoZWxlbUhlaWdodCArIG1Ub3ApO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnN0aWNrVG8gPT09ICdib3R0b20nKSB7XG4gICAgICB0b3BQb2ludCAtPSAod2luSGVpZ2h0IC0gKGVsZW1IZWlnaHQgKyBtQnRtKSk7XG4gICAgICBib3R0b21Qb2ludCAtPSAod2luSGVpZ2h0IC0gbUJ0bSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vdGhpcyB3b3VsZCBiZSB0aGUgc3RpY2tUbzogYm90aCBvcHRpb24uLi4gdHJpY2t5XG4gICAgfVxuXG4gICAgdGhpcy50b3BQb2ludCA9IHRvcFBvaW50O1xuICAgIHRoaXMuYm90dG9tUG9pbnQgPSBib3R0b21Qb2ludDtcblxuICAgIGlmIChjYikgeyBjYigpOyB9XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGN1cnJlbnQgc3RpY2t5IGVsZW1lbnQuXG4gICAqIFJlc2V0cyB0aGUgZWxlbWVudCB0byB0aGUgdG9wIHBvc2l0aW9uIGZpcnN0LlxuICAgKiBSZW1vdmVzIGV2ZW50IGxpc3RlbmVycywgSlMtYWRkZWQgY3NzIHByb3BlcnRpZXMgYW5kIGNsYXNzZXMsIGFuZCB1bndyYXBzIHRoZSAkZWxlbWVudCBpZiB0aGUgSlMgYWRkZWQgdGhlICRjb250YWluZXIuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLl9yZW1vdmVTdGlja3kodHJ1ZSk7XG5cbiAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKGAke3RoaXMub3B0aW9ucy5zdGlja3lDbGFzc30gaXMtYW5jaG9yZWQgaXMtYXQtdG9wYClcbiAgICAgICAgICAgICAgICAgLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnJyxcbiAgICAgICAgICAgICAgICAgICB0b3A6ICcnLFxuICAgICAgICAgICAgICAgICAgIGJvdHRvbTogJycsXG4gICAgICAgICAgICAgICAgICAgJ21heC13aWR0aCc6ICcnXG4gICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgIC5vZmYoJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInKTtcblxuICAgIHRoaXMuJGFuY2hvci5vZmYoJ2NoYW5nZS56Zi5zdGlja3knKTtcbiAgICAkKHdpbmRvdykub2ZmKHRoaXMuc2Nyb2xsTGlzdGVuZXIpO1xuXG4gICAgaWYgKHRoaXMud2FzV3JhcHBlZCkge1xuICAgICAgdGhpcy4kZWxlbWVudC51bndyYXAoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kY29udGFpbmVyLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5jb250YWluZXJDbGFzcylcbiAgICAgICAgICAgICAgICAgICAgIC5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcnXG4gICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICB9XG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cblN0aWNreS5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIEN1c3RvbWl6YWJsZSBjb250YWluZXIgdGVtcGxhdGUuIEFkZCB5b3VyIG93biBjbGFzc2VzIGZvciBzdHlsaW5nIGFuZCBzaXppbmcuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJyZsdDtkaXYgZGF0YS1zdGlja3ktY29udGFpbmVyIGNsYXNzPVwic21hbGwtNiBjb2x1bW5zXCImZ3Q7Jmx0Oy9kaXYmZ3Q7J1xuICAgKi9cbiAgY29udGFpbmVyOiAnPGRpdiBkYXRhLXN0aWNreS1jb250YWluZXI+PC9kaXY+JyxcbiAgLyoqXG4gICAqIExvY2F0aW9uIGluIHRoZSB2aWV3IHRoZSBlbGVtZW50IHN0aWNrcyB0by5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAndG9wJ1xuICAgKi9cbiAgc3RpY2tUbzogJ3RvcCcsXG4gIC8qKlxuICAgKiBJZiBhbmNob3JlZCB0byBhIHNpbmdsZSBlbGVtZW50LCB0aGUgaWQgb2YgdGhhdCBlbGVtZW50LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdleGFtcGxlSWQnXG4gICAqL1xuICBhbmNob3I6ICcnLFxuICAvKipcbiAgICogSWYgdXNpbmcgbW9yZSB0aGFuIG9uZSBlbGVtZW50IGFzIGFuY2hvciBwb2ludHMsIHRoZSBpZCBvZiB0aGUgdG9wIGFuY2hvci5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnZXhhbXBsZUlkOnRvcCdcbiAgICovXG4gIHRvcEFuY2hvcjogJycsXG4gIC8qKlxuICAgKiBJZiB1c2luZyBtb3JlIHRoYW4gb25lIGVsZW1lbnQgYXMgYW5jaG9yIHBvaW50cywgdGhlIGlkIG9mIHRoZSBib3R0b20gYW5jaG9yLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdleGFtcGxlSWQ6Ym90dG9tJ1xuICAgKi9cbiAgYnRtQW5jaG9yOiAnJyxcbiAgLyoqXG4gICAqIE1hcmdpbiwgaW4gYGVtYCdzIHRvIGFwcGx5IHRvIHRoZSB0b3Agb2YgdGhlIGVsZW1lbnQgd2hlbiBpdCBiZWNvbWVzIHN0aWNreS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAxXG4gICAqL1xuICBtYXJnaW5Ub3A6IDEsXG4gIC8qKlxuICAgKiBNYXJnaW4sIGluIGBlbWAncyB0byBhcHBseSB0byB0aGUgYm90dG9tIG9mIHRoZSBlbGVtZW50IHdoZW4gaXQgYmVjb21lcyBzdGlja3kuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMVxuICAgKi9cbiAgbWFyZ2luQm90dG9tOiAxLFxuICAvKipcbiAgICogQnJlYWtwb2ludCBzdHJpbmcgdGhhdCBpcyB0aGUgbWluaW11bSBzY3JlZW4gc2l6ZSBhbiBlbGVtZW50IHNob3VsZCBiZWNvbWUgc3RpY2t5LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdtZWRpdW0nXG4gICAqL1xuICBzdGlja3lPbjogJ21lZGl1bScsXG4gIC8qKlxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHN0aWNreSBlbGVtZW50LCBhbmQgcmVtb3ZlZCBvbiBkZXN0cnVjdGlvbi4gRm91bmRhdGlvbiBkZWZhdWx0cyB0byBgc3RpY2t5YC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnc3RpY2t5J1xuICAgKi9cbiAgc3RpY2t5Q2xhc3M6ICdzdGlja3knLFxuICAvKipcbiAgICogQ2xhc3MgYXBwbGllZCB0byBzdGlja3kgY29udGFpbmVyLiBGb3VuZGF0aW9uIGRlZmF1bHRzIHRvIGBzdGlja3ktY29udGFpbmVyYC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnc3RpY2t5LWNvbnRhaW5lcidcbiAgICovXG4gIGNvbnRhaW5lckNsYXNzOiAnc3RpY2t5LWNvbnRhaW5lcicsXG4gIC8qKlxuICAgKiBOdW1iZXIgb2Ygc2Nyb2xsIGV2ZW50cyBiZXR3ZWVuIHRoZSBwbHVnaW4ncyByZWNhbGN1bGF0aW5nIHN0aWNreSBwb2ludHMuIFNldHRpbmcgaXQgdG8gYDBgIHdpbGwgY2F1c2UgaXQgdG8gcmVjYWxjIGV2ZXJ5IHNjcm9sbCBldmVudCwgc2V0dGluZyBpdCB0byBgLTFgIHdpbGwgcHJldmVudCByZWNhbGMgb24gc2Nyb2xsLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDUwXG4gICAqL1xuICBjaGVja0V2ZXJ5OiAtMVxufTtcblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gY2FsY3VsYXRlIGVtIHZhbHVlc1xuICogQHBhcmFtIE51bWJlciB7ZW19IC0gbnVtYmVyIG9mIGVtJ3MgdG8gY2FsY3VsYXRlIGludG8gcGl4ZWxzXG4gKi9cbmZ1bmN0aW9uIGVtQ2FsYyhlbSkge1xuICByZXR1cm4gcGFyc2VJbnQod2luZG93LmdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSwgbnVsbCkuZm9udFNpemUsIDEwKSAqIGVtO1xufVxuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oU3RpY2t5LCAnU3RpY2t5Jyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBUYWJzIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi50YWJzXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRpbWVyQW5kSW1hZ2VMb2FkZXIgaWYgdGFicyBjb250YWluIGltYWdlc1xuICovXG5cbmNsYXNzIFRhYnMge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiB0YWJzLlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIFRhYnMjaW5pdFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIHRhYnMuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgVGFicy5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1RhYnMnKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdUYWJzJywge1xuICAgICAgJ0VOVEVSJzogJ29wZW4nLFxuICAgICAgJ1NQQUNFJzogJ29wZW4nLFxuICAgICAgJ0FSUk9XX1JJR0hUJzogJ25leHQnLFxuICAgICAgJ0FSUk9XX1VQJzogJ3ByZXZpb3VzJyxcbiAgICAgICdBUlJPV19ET1dOJzogJ25leHQnLFxuICAgICAgJ0FSUk9XX0xFRlQnOiAncHJldmlvdXMnXG4gICAgICAvLyAnVEFCJzogJ25leHQnLFxuICAgICAgLy8gJ1NISUZUX1RBQic6ICdwcmV2aW91cydcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgdGFicyBieSBzaG93aW5nIGFuZCBmb2N1c2luZyAoaWYgYXV0b0ZvY3VzPXRydWUpIHRoZSBwcmVzZXQgYWN0aXZlIHRhYi5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLiR0YWJUaXRsZXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoYC4ke3RoaXMub3B0aW9ucy5saW5rQ2xhc3N9YCk7XG4gICAgdGhpcy4kdGFiQ29udGVudCA9ICQoYFtkYXRhLXRhYnMtY29udGVudD1cIiR7dGhpcy4kZWxlbWVudFswXS5pZH1cIl1gKTtcblxuICAgIHRoaXMuJHRhYlRpdGxlcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgJGVsZW0gPSAkKHRoaXMpLFxuICAgICAgICAgICRsaW5rID0gJGVsZW0uZmluZCgnYScpLFxuICAgICAgICAgIGlzQWN0aXZlID0gJGVsZW0uaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpLFxuICAgICAgICAgIGhhc2ggPSAkbGlua1swXS5oYXNoLnNsaWNlKDEpLFxuICAgICAgICAgIGxpbmtJZCA9ICRsaW5rWzBdLmlkID8gJGxpbmtbMF0uaWQgOiBgJHtoYXNofS1sYWJlbGAsXG4gICAgICAgICAgJHRhYkNvbnRlbnQgPSAkKGAjJHtoYXNofWApO1xuXG4gICAgICAkZWxlbS5hdHRyKHsncm9sZSc6ICdwcmVzZW50YXRpb24nfSk7XG5cbiAgICAgICRsaW5rLmF0dHIoe1xuICAgICAgICAncm9sZSc6ICd0YWInLFxuICAgICAgICAnYXJpYS1jb250cm9scyc6IGhhc2gsXG4gICAgICAgICdhcmlhLXNlbGVjdGVkJzogaXNBY3RpdmUsXG4gICAgICAgICdpZCc6IGxpbmtJZFxuICAgICAgfSk7XG5cbiAgICAgICR0YWJDb250ZW50LmF0dHIoe1xuICAgICAgICAncm9sZSc6ICd0YWJwYW5lbCcsXG4gICAgICAgICdhcmlhLWhpZGRlbic6ICFpc0FjdGl2ZSxcbiAgICAgICAgJ2FyaWEtbGFiZWxsZWRieSc6IGxpbmtJZFxuICAgICAgfSk7XG5cbiAgICAgIGlmKGlzQWN0aXZlICYmIF90aGlzLm9wdGlvbnMuYXV0b0ZvY3VzKXtcbiAgICAgICAgJGxpbmsuZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmKHRoaXMub3B0aW9ucy5tYXRjaEhlaWdodCkge1xuICAgICAgdmFyICRpbWFnZXMgPSB0aGlzLiR0YWJDb250ZW50LmZpbmQoJ2ltZycpO1xuXG4gICAgICBpZiAoJGltYWdlcy5sZW5ndGgpIHtcbiAgICAgICAgRm91bmRhdGlvbi5vbkltYWdlc0xvYWRlZCgkaW1hZ2VzLCB0aGlzLl9zZXRIZWlnaHQuYmluZCh0aGlzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zZXRIZWlnaHQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIGZvciBpdGVtcyB3aXRoaW4gdGhlIHRhYnMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHRoaXMuX2FkZEtleUhhbmRsZXIoKTtcbiAgICB0aGlzLl9hZGRDbGlja0hhbmRsZXIoKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMubWF0Y2hIZWlnaHQpIHtcbiAgICAgICQod2luZG93KS5vbignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgdGhpcy5fc2V0SGVpZ2h0LmJpbmQodGhpcykpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGNsaWNrIGhhbmRsZXJzIGZvciBpdGVtcyB3aXRoaW4gdGhlIHRhYnMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfYWRkQ2xpY2tIYW5kbGVyKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLiRlbGVtZW50XG4gICAgICAub2ZmKCdjbGljay56Zi50YWJzJylcbiAgICAgIC5vbignY2xpY2suemYudGFicycsIGAuJHt0aGlzLm9wdGlvbnMubGlua0NsYXNzfWAsIGZ1bmN0aW9uKGUpe1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGlmICgkKHRoaXMpLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBfdGhpcy5faGFuZGxlVGFiQ2hhbmdlKCQodGhpcykpO1xuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBrZXlib2FyZCBldmVudCBoYW5kbGVycyBmb3IgaXRlbXMgd2l0aGluIHRoZSB0YWJzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2FkZEtleUhhbmRsZXIoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB2YXIgJGZpcnN0VGFiID0gX3RoaXMuJGVsZW1lbnQuZmluZCgnbGk6Zmlyc3Qtb2YtdHlwZScpO1xuICAgIHZhciAkbGFzdFRhYiA9IF90aGlzLiRlbGVtZW50LmZpbmQoJ2xpOmxhc3Qtb2YtdHlwZScpO1xuXG4gICAgdGhpcy4kdGFiVGl0bGVzLm9mZigna2V5ZG93bi56Zi50YWJzJykub24oJ2tleWRvd24uemYudGFicycsIGZ1bmN0aW9uKGUpe1xuICAgICAgaWYgKGUud2hpY2ggPT09IDkpIHJldHVybjtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIHZhciAkZWxlbWVudCA9ICQodGhpcyksXG4gICAgICAgICRlbGVtZW50cyA9ICRlbGVtZW50LnBhcmVudCgndWwnKS5jaGlsZHJlbignbGknKSxcbiAgICAgICAgJHByZXZFbGVtZW50LFxuICAgICAgICAkbmV4dEVsZW1lbnQ7XG5cbiAgICAgICRlbGVtZW50cy5lYWNoKGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgaWYgKCQodGhpcykuaXMoJGVsZW1lbnQpKSB7XG4gICAgICAgICAgaWYgKF90aGlzLm9wdGlvbnMud3JhcE9uS2V5cykge1xuICAgICAgICAgICAgJHByZXZFbGVtZW50ID0gaSA9PT0gMCA/ICRlbGVtZW50cy5sYXN0KCkgOiAkZWxlbWVudHMuZXEoaS0xKTtcbiAgICAgICAgICAgICRuZXh0RWxlbWVudCA9IGkgPT09ICRlbGVtZW50cy5sZW5ndGggLTEgPyAkZWxlbWVudHMuZmlyc3QoKSA6ICRlbGVtZW50cy5lcShpKzEpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkZWxlbWVudHMuZXEoTWF0aC5tYXgoMCwgaS0xKSk7XG4gICAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudHMuZXEoTWF0aC5taW4oaSsxLCAkZWxlbWVudHMubGVuZ3RoLTEpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gaGFuZGxlIGtleWJvYXJkIGV2ZW50IHdpdGgga2V5Ym9hcmQgdXRpbFxuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ1RhYnMnLCB7XG4gICAgICAgIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICRlbGVtZW50LmZpbmQoJ1tyb2xlPVwidGFiXCJdJykuZm9jdXMoKTtcbiAgICAgICAgICBfdGhpcy5faGFuZGxlVGFiQ2hhbmdlKCRlbGVtZW50KTtcbiAgICAgICAgfSxcbiAgICAgICAgcHJldmlvdXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICRwcmV2RWxlbWVudC5maW5kKCdbcm9sZT1cInRhYlwiXScpLmZvY3VzKCk7XG4gICAgICAgICAgX3RoaXMuX2hhbmRsZVRhYkNoYW5nZSgkcHJldkVsZW1lbnQpO1xuICAgICAgICB9LFxuICAgICAgICBuZXh0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAkbmV4dEVsZW1lbnQuZmluZCgnW3JvbGU9XCJ0YWJcIl0nKS5mb2N1cygpO1xuICAgICAgICAgIF90aGlzLl9oYW5kbGVUYWJDaGFuZ2UoJG5leHRFbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgdGhlIHRhYiBgJHRhcmdldENvbnRlbnRgIGRlZmluZWQgYnkgYCR0YXJnZXRgLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIFRhYiB0byBvcGVuLlxuICAgKiBAZmlyZXMgVGFicyNjaGFuZ2VcbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBfaGFuZGxlVGFiQ2hhbmdlKCR0YXJnZXQpIHtcbiAgICB2YXIgJHRhYkxpbmsgPSAkdGFyZ2V0LmZpbmQoJ1tyb2xlPVwidGFiXCJdJyksXG4gICAgICAgIGhhc2ggPSAkdGFiTGlua1swXS5oYXNoLFxuICAgICAgICAkdGFyZ2V0Q29udGVudCA9IHRoaXMuJHRhYkNvbnRlbnQuZmluZChoYXNoKSxcbiAgICAgICAgJG9sZFRhYiA9IHRoaXMuJGVsZW1lbnQuXG4gICAgICAgICAgZmluZChgLiR7dGhpcy5vcHRpb25zLmxpbmtDbGFzc30uaXMtYWN0aXZlYClcbiAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpXG4gICAgICAgICAgLmZpbmQoJ1tyb2xlPVwidGFiXCJdJylcbiAgICAgICAgICAuYXR0cih7ICdhcmlhLXNlbGVjdGVkJzogJ2ZhbHNlJyB9KTtcblxuICAgICQoYCMkeyRvbGRUYWIuYXR0cignYXJpYS1jb250cm9scycpfWApXG4gICAgICAucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpXG4gICAgICAuYXR0cih7ICdhcmlhLWhpZGRlbic6ICd0cnVlJyB9KTtcblxuICAgICR0YXJnZXQuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuXG4gICAgJHRhYkxpbmsuYXR0cih7J2FyaWEtc2VsZWN0ZWQnOiAndHJ1ZSd9KTtcblxuICAgICR0YXJnZXRDb250ZW50XG4gICAgICAuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpXG4gICAgICAuYXR0cih7J2FyaWEtaGlkZGVuJzogJ2ZhbHNlJ30pO1xuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBzdWNjZXNzZnVsbHkgY2hhbmdlZCB0YWJzLlxuICAgICAqIEBldmVudCBUYWJzI2NoYW5nZVxuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignY2hhbmdlLnpmLnRhYnMnLCBbJHRhcmdldF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFB1YmxpYyBtZXRob2QgZm9yIHNlbGVjdGluZyBhIGNvbnRlbnQgcGFuZSB0byBkaXNwbGF5LlxuICAgKiBAcGFyYW0ge2pRdWVyeSB8IFN0cmluZ30gZWxlbSAtIGpRdWVyeSBvYmplY3Qgb3Igc3RyaW5nIG9mIHRoZSBpZCBvZiB0aGUgcGFuZSB0byBkaXNwbGF5LlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHNlbGVjdFRhYihlbGVtKSB7XG4gICAgdmFyIGlkU3RyO1xuXG4gICAgaWYgKHR5cGVvZiBlbGVtID09PSAnb2JqZWN0Jykge1xuICAgICAgaWRTdHIgPSBlbGVtWzBdLmlkO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZFN0ciA9IGVsZW07XG4gICAgfVxuXG4gICAgaWYgKGlkU3RyLmluZGV4T2YoJyMnKSA8IDApIHtcbiAgICAgIGlkU3RyID0gYCMke2lkU3RyfWA7XG4gICAgfVxuXG4gICAgdmFyICR0YXJnZXQgPSB0aGlzLiR0YWJUaXRsZXMuZmluZChgW2hyZWY9XCIke2lkU3RyfVwiXWApLnBhcmVudChgLiR7dGhpcy5vcHRpb25zLmxpbmtDbGFzc31gKTtcblxuICAgIHRoaXMuX2hhbmRsZVRhYkNoYW5nZSgkdGFyZ2V0KTtcbiAgfTtcbiAgLyoqXG4gICAqIFNldHMgdGhlIGhlaWdodCBvZiBlYWNoIHBhbmVsIHRvIHRoZSBoZWlnaHQgb2YgdGhlIHRhbGxlc3QgcGFuZWwuXG4gICAqIElmIGVuYWJsZWQgaW4gb3B0aW9ucywgZ2V0cyBjYWxsZWQgb24gbWVkaWEgcXVlcnkgY2hhbmdlLlxuICAgKiBJZiBsb2FkaW5nIGNvbnRlbnQgdmlhIGV4dGVybmFsIHNvdXJjZSwgY2FuIGJlIGNhbGxlZCBkaXJlY3RseSBvciB3aXRoIF9yZWZsb3cuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3NldEhlaWdodCgpIHtcbiAgICB2YXIgbWF4ID0gMDtcbiAgICB0aGlzLiR0YWJDb250ZW50XG4gICAgICAuZmluZChgLiR7dGhpcy5vcHRpb25zLnBhbmVsQ2xhc3N9YClcbiAgICAgIC5jc3MoJ2hlaWdodCcsICcnKVxuICAgICAgLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBwYW5lbCA9ICQodGhpcyksXG4gICAgICAgICAgICBpc0FjdGl2ZSA9IHBhbmVsLmhhc0NsYXNzKCdpcy1hY3RpdmUnKTtcblxuICAgICAgICBpZiAoIWlzQWN0aXZlKSB7XG4gICAgICAgICAgcGFuZWwuY3NzKHsndmlzaWJpbGl0eSc6ICdoaWRkZW4nLCAnZGlzcGxheSc6ICdibG9jayd9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0ZW1wID0gdGhpcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQ7XG5cbiAgICAgICAgaWYgKCFpc0FjdGl2ZSkge1xuICAgICAgICAgIHBhbmVsLmNzcyh7XG4gICAgICAgICAgICAndmlzaWJpbGl0eSc6ICcnLFxuICAgICAgICAgICAgJ2Rpc3BsYXknOiAnJ1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgbWF4ID0gdGVtcCA+IG1heCA/IHRlbXAgOiBtYXg7XG4gICAgICB9KVxuICAgICAgLmNzcygnaGVpZ2h0JywgYCR7bWF4fXB4YCk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgYW4gdGFicy5cbiAgICogQGZpcmVzIFRhYnMjZGVzdHJveWVkXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5maW5kKGAuJHt0aGlzLm9wdGlvbnMubGlua0NsYXNzfWApXG4gICAgICAub2ZmKCcuemYudGFicycpLmhpZGUoKS5lbmQoKVxuICAgICAgLmZpbmQoYC4ke3RoaXMub3B0aW9ucy5wYW5lbENsYXNzfWApXG4gICAgICAuaGlkZSgpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5tYXRjaEhlaWdodCkge1xuICAgICAgJCh3aW5kb3cpLm9mZignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5Jyk7XG4gICAgfVxuXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cblRhYnMuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIHdpbmRvdyB0byBzY3JvbGwgdG8gY29udGVudCBvZiBhY3RpdmUgcGFuZSBvbiBsb2FkIGlmIHNldCB0byB0cnVlLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBhdXRvRm9jdXM6IGZhbHNlLFxuXG4gIC8qKlxuICAgKiBBbGxvd3Mga2V5Ym9hcmQgaW5wdXQgdG8gJ3dyYXAnIGFyb3VuZCB0aGUgdGFiIGxpbmtzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIHdyYXBPbktleXM6IHRydWUsXG5cbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgdGFiIGNvbnRlbnQgcGFuZXMgdG8gbWF0Y2ggaGVpZ2h0cyBpZiBzZXQgdG8gdHJ1ZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgbWF0Y2hIZWlnaHQ6IGZhbHNlLFxuXG4gIC8qKlxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIGBsaWAncyBpbiB0YWIgbGluayBsaXN0LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICd0YWJzLXRpdGxlJ1xuICAgKi9cbiAgbGlua0NsYXNzOiAndGFicy10aXRsZScsXG5cbiAgLyoqXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gdGhlIGNvbnRlbnQgY29udGFpbmVycy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAndGFicy1wYW5lbCdcbiAgICovXG4gIHBhbmVsQ2xhc3M6ICd0YWJzLXBhbmVsJ1xufTtcblxuZnVuY3Rpb24gY2hlY2tDbGFzcygkZWxlbSl7XG4gIHJldHVybiAkZWxlbS5oYXNDbGFzcygnaXMtYWN0aXZlJyk7XG59XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihUYWJzLCAnVGFicycpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogVG9nZ2xlciBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24udG9nZ2xlclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb25cbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcbiAqL1xuXG5jbGFzcyBUb2dnbGVyIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgVG9nZ2xlci5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBUb2dnbGVyI2luaXRcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGFkZCB0aGUgdHJpZ2dlciB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBUb2dnbGVyLmRlZmF1bHRzLCBlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG4gICAgdGhpcy5jbGFzc05hbWUgPSAnJztcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLl9ldmVudHMoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1RvZ2dsZXInKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgVG9nZ2xlciBwbHVnaW4gYnkgcGFyc2luZyB0aGUgdG9nZ2xlIGNsYXNzIGZyb20gZGF0YS10b2dnbGVyLCBvciBhbmltYXRpb24gY2xhc3NlcyBmcm9tIGRhdGEtYW5pbWF0ZS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgaW5wdXQ7XG4gICAgLy8gUGFyc2UgYW5pbWF0aW9uIGNsYXNzZXMgaWYgdGhleSB3ZXJlIHNldFxuICAgIGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0ZSkge1xuICAgICAgaW5wdXQgPSB0aGlzLm9wdGlvbnMuYW5pbWF0ZS5zcGxpdCgnICcpO1xuXG4gICAgICB0aGlzLmFuaW1hdGlvbkluID0gaW5wdXRbMF07XG4gICAgICB0aGlzLmFuaW1hdGlvbk91dCA9IGlucHV0WzFdIHx8IG51bGw7XG4gICAgfVxuICAgIC8vIE90aGVyd2lzZSwgcGFyc2UgdG9nZ2xlIGNsYXNzXG4gICAgZWxzZSB7XG4gICAgICBpbnB1dCA9IHRoaXMuJGVsZW1lbnQuZGF0YSgndG9nZ2xlcicpO1xuICAgICAgLy8gQWxsb3cgZm9yIGEgLiBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzdHJpbmdcbiAgICAgIHRoaXMuY2xhc3NOYW1lID0gaW5wdXRbMF0gPT09ICcuJyA/IGlucHV0LnNsaWNlKDEpIDogaW5wdXQ7XG4gICAgfVxuXG4gICAgLy8gQWRkIEFSSUEgYXR0cmlidXRlcyB0byB0cmlnZ2Vyc1xuICAgIHZhciBpZCA9IHRoaXMuJGVsZW1lbnRbMF0uaWQ7XG4gICAgJChgW2RhdGEtb3Blbj1cIiR7aWR9XCJdLCBbZGF0YS1jbG9zZT1cIiR7aWR9XCJdLCBbZGF0YS10b2dnbGU9XCIke2lkfVwiXWApXG4gICAgICAuYXR0cignYXJpYS1jb250cm9scycsIGlkKTtcbiAgICAvLyBJZiB0aGUgdGFyZ2V0IGlzIGhpZGRlbiwgYWRkIGFyaWEtaGlkZGVuXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgdGhpcy4kZWxlbWVudC5pcygnOmhpZGRlbicpID8gZmFsc2UgOiB0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBldmVudHMgZm9yIHRoZSB0b2dnbGUgdHJpZ2dlci5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCd0b2dnbGUuemYudHJpZ2dlcicpLm9uKCd0b2dnbGUuemYudHJpZ2dlcicsIHRoaXMudG9nZ2xlLmJpbmQodGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIHRhcmdldCBjbGFzcyBvbiB0aGUgdGFyZ2V0IGVsZW1lbnQuIEFuIGV2ZW50IGlzIGZpcmVkIGZyb20gdGhlIG9yaWdpbmFsIHRyaWdnZXIgZGVwZW5kaW5nIG9uIGlmIHRoZSByZXN1bHRhbnQgc3RhdGUgd2FzIFwib25cIiBvciBcIm9mZlwiLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIFRvZ2dsZXIjb25cbiAgICogQGZpcmVzIFRvZ2dsZXIjb2ZmXG4gICAqL1xuICB0b2dnbGUoKSB7XG4gICAgdGhpc1sgdGhpcy5vcHRpb25zLmFuaW1hdGUgPyAnX3RvZ2dsZUFuaW1hdGUnIDogJ190b2dnbGVDbGFzcyddKCk7XG4gIH1cblxuICBfdG9nZ2xlQ2xhc3MoKSB7XG4gICAgdGhpcy4kZWxlbWVudC50b2dnbGVDbGFzcyh0aGlzLmNsYXNzTmFtZSk7XG5cbiAgICB2YXIgaXNPbiA9IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3ModGhpcy5jbGFzc05hbWUpO1xuICAgIGlmIChpc09uKSB7XG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIGlmIHRoZSB0YXJnZXQgZWxlbWVudCBoYXMgdGhlIGNsYXNzIGFmdGVyIGEgdG9nZ2xlLlxuICAgICAgICogQGV2ZW50IFRvZ2dsZXIjb25cbiAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdvbi56Zi50b2dnbGVyJyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyBpZiB0aGUgdGFyZ2V0IGVsZW1lbnQgZG9lcyBub3QgaGF2ZSB0aGUgY2xhc3MgYWZ0ZXIgYSB0b2dnbGUuXG4gICAgICAgKiBAZXZlbnQgVG9nZ2xlciNvZmZcbiAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdvZmYuemYudG9nZ2xlcicpO1xuICAgIH1cblxuICAgIHRoaXMuX3VwZGF0ZUFSSUEoaXNPbik7XG4gIH1cblxuICBfdG9nZ2xlQW5pbWF0ZSgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuaXMoJzpoaWRkZW4nKSkge1xuICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZUluKHRoaXMuJGVsZW1lbnQsIHRoaXMuYW5pbWF0aW9uSW4sIGZ1bmN0aW9uKCkge1xuICAgICAgICBfdGhpcy5fdXBkYXRlQVJJQSh0cnVlKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdvbi56Zi50b2dnbGVyJyk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlT3V0KHRoaXMuJGVsZW1lbnQsIHRoaXMuYW5pbWF0aW9uT3V0LCBmdW5jdGlvbigpIHtcbiAgICAgICAgX3RoaXMuX3VwZGF0ZUFSSUEoZmFsc2UpO1xuICAgICAgICB0aGlzLnRyaWdnZXIoJ29mZi56Zi50b2dnbGVyJyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBfdXBkYXRlQVJJQShpc09uKSB7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgaXNPbiA/IHRydWUgOiBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGluc3RhbmNlIG9mIFRvZ2dsZXIgb24gdGhlIGVsZW1lbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRvZ2dsZXInKTtcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuVG9nZ2xlci5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIFRlbGxzIHRoZSBwbHVnaW4gaWYgdGhlIGVsZW1lbnQgc2hvdWxkIGFuaW1hdGVkIHdoZW4gdG9nZ2xlZC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgYW5pbWF0ZTogZmFsc2Vcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihUb2dnbGVyLCAnVG9nZ2xlcicpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogVG9vbHRpcCBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24udG9vbHRpcFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5ib3hcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcbiAqL1xuXG5jbGFzcyBUb29sdGlwIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSBUb29sdGlwLlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIFRvb2x0aXAjaW5pdFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYXR0YWNoIGEgdG9vbHRpcCB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBvYmplY3QgdG8gZXh0ZW5kIHRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIFRvb2x0aXAuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIHRoaXMuaXNBY3RpdmUgPSBmYWxzZTtcbiAgICB0aGlzLmlzQ2xpY2sgPSBmYWxzZTtcbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdUb29sdGlwJyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHRvb2x0aXAgYnkgc2V0dGluZyB0aGUgY3JlYXRpbmcgdGhlIHRpcCBlbGVtZW50LCBhZGRpbmcgaXQncyB0ZXh0LCBzZXR0aW5nIHByaXZhdGUgdmFyaWFibGVzIGFuZCBzZXR0aW5nIGF0dHJpYnV0ZXMgb24gdGhlIGFuY2hvci5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBlbGVtSWQgPSB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtZGVzY3JpYmVkYnknKSB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICd0b29sdGlwJyk7XG5cbiAgICB0aGlzLm9wdGlvbnMucG9zaXRpb25DbGFzcyA9IHRoaXMuX2dldFBvc2l0aW9uQ2xhc3ModGhpcy4kZWxlbWVudCk7XG4gICAgdGhpcy5vcHRpb25zLnRpcFRleHQgPSB0aGlzLm9wdGlvbnMudGlwVGV4dCB8fCB0aGlzLiRlbGVtZW50LmF0dHIoJ3RpdGxlJyk7XG4gICAgdGhpcy50ZW1wbGF0ZSA9IHRoaXMub3B0aW9ucy50ZW1wbGF0ZSA/ICQodGhpcy5vcHRpb25zLnRlbXBsYXRlKSA6IHRoaXMuX2J1aWxkVGVtcGxhdGUoZWxlbUlkKTtcblxuICAgIHRoaXMudGVtcGxhdGUuYXBwZW5kVG8oZG9jdW1lbnQuYm9keSlcbiAgICAgICAgLnRleHQodGhpcy5vcHRpb25zLnRpcFRleHQpXG4gICAgICAgIC5oaWRlKCk7XG5cbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoe1xuICAgICAgJ3RpdGxlJzogJycsXG4gICAgICAnYXJpYS1kZXNjcmliZWRieSc6IGVsZW1JZCxcbiAgICAgICdkYXRhLXlldGktYm94JzogZWxlbUlkLFxuICAgICAgJ2RhdGEtdG9nZ2xlJzogZWxlbUlkLFxuICAgICAgJ2RhdGEtcmVzaXplJzogZWxlbUlkXG4gICAgfSkuYWRkQ2xhc3ModGhpcy50cmlnZ2VyQ2xhc3MpO1xuXG4gICAgLy9oZWxwZXIgdmFyaWFibGVzIHRvIHRyYWNrIG1vdmVtZW50IG9uIGNvbGxpc2lvbnNcbiAgICB0aGlzLnVzZWRQb3NpdGlvbnMgPSBbXTtcbiAgICB0aGlzLmNvdW50ZXIgPSA0O1xuICAgIHRoaXMuY2xhc3NDaGFuZ2VkID0gZmFsc2U7XG5cbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHcmFicyB0aGUgY3VycmVudCBwb3NpdGlvbmluZyBjbGFzcywgaWYgcHJlc2VudCwgYW5kIHJldHVybnMgdGhlIHZhbHVlIG9yIGFuIGVtcHR5IHN0cmluZy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9nZXRQb3NpdGlvbkNsYXNzKGVsZW1lbnQpIHtcbiAgICBpZiAoIWVsZW1lbnQpIHsgcmV0dXJuICcnOyB9XG4gICAgLy8gdmFyIHBvc2l0aW9uID0gZWxlbWVudC5hdHRyKCdjbGFzcycpLm1hdGNoKC90b3B8bGVmdHxyaWdodC9nKTtcbiAgICB2YXIgcG9zaXRpb24gPSBlbGVtZW50WzBdLmNsYXNzTmFtZS5tYXRjaCgvXFxiKHRvcHxsZWZ0fHJpZ2h0KVxcYi9nKTtcbiAgICAgICAgcG9zaXRpb24gPSBwb3NpdGlvbiA/IHBvc2l0aW9uWzBdIDogJyc7XG4gICAgcmV0dXJuIHBvc2l0aW9uO1xuICB9O1xuICAvKipcbiAgICogYnVpbGRzIHRoZSB0b29sdGlwIGVsZW1lbnQsIGFkZHMgYXR0cmlidXRlcywgYW5kIHJldHVybnMgdGhlIHRlbXBsYXRlLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2J1aWxkVGVtcGxhdGUoaWQpIHtcbiAgICB2YXIgdGVtcGxhdGVDbGFzc2VzID0gKGAke3RoaXMub3B0aW9ucy50b29sdGlwQ2xhc3N9ICR7dGhpcy5vcHRpb25zLnBvc2l0aW9uQ2xhc3N9ICR7dGhpcy5vcHRpb25zLnRlbXBsYXRlQ2xhc3Nlc31gKS50cmltKCk7XG4gICAgdmFyICR0ZW1wbGF0ZSA9ICAkKCc8ZGl2PjwvZGl2PicpLmFkZENsYXNzKHRlbXBsYXRlQ2xhc3NlcykuYXR0cih7XG4gICAgICAncm9sZSc6ICd0b29sdGlwJyxcbiAgICAgICdhcmlhLWhpZGRlbic6IHRydWUsXG4gICAgICAnZGF0YS1pcy1hY3RpdmUnOiBmYWxzZSxcbiAgICAgICdkYXRhLWlzLWZvY3VzJzogZmFsc2UsXG4gICAgICAnaWQnOiBpZFxuICAgIH0pO1xuICAgIHJldHVybiAkdGVtcGxhdGU7XG4gIH1cblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBnZXRzIGNhbGxlZCBpZiBhIGNvbGxpc2lvbiBldmVudCBpcyBkZXRlY3RlZC5cbiAgICogQHBhcmFtIHtTdHJpbmd9IHBvc2l0aW9uIC0gcG9zaXRpb25pbmcgY2xhc3MgdG8gdHJ5XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfcmVwb3NpdGlvbihwb3NpdGlvbikge1xuICAgIHRoaXMudXNlZFBvc2l0aW9ucy5wdXNoKHBvc2l0aW9uID8gcG9zaXRpb24gOiAnYm90dG9tJyk7XG5cbiAgICAvL2RlZmF1bHQsIHRyeSBzd2l0Y2hpbmcgdG8gb3Bwb3NpdGUgc2lkZVxuICAgIGlmICghcG9zaXRpb24gJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCd0b3AnKSA8IDApKSB7XG4gICAgICB0aGlzLnRlbXBsYXRlLmFkZENsYXNzKCd0b3AnKTtcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uID09PSAndG9wJyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpIHtcbiAgICAgIHRoaXMudGVtcGxhdGUucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xuICAgIH0gZWxzZSBpZiAocG9zaXRpb24gPT09ICdsZWZ0JyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3JpZ2h0JykgPCAwKSkge1xuICAgICAgdGhpcy50ZW1wbGF0ZS5yZW1vdmVDbGFzcyhwb3NpdGlvbilcbiAgICAgICAgICAuYWRkQ2xhc3MoJ3JpZ2h0Jyk7XG4gICAgfSBlbHNlIGlmIChwb3NpdGlvbiA9PT0gJ3JpZ2h0JyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2xlZnQnKSA8IDApKSB7XG4gICAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxuICAgICAgICAgIC5hZGRDbGFzcygnbGVmdCcpO1xuICAgIH1cblxuICAgIC8vaWYgZGVmYXVsdCBjaGFuZ2UgZGlkbid0IHdvcmssIHRyeSBib3R0b20gb3IgbGVmdCBmaXJzdFxuICAgIGVsc2UgaWYgKCFwb3NpdGlvbiAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3RvcCcpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpIHtcbiAgICAgIHRoaXMudGVtcGxhdGUuYWRkQ2xhc3MoJ2xlZnQnKTtcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uID09PSAndG9wJyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpIHtcbiAgICAgIHRoaXMudGVtcGxhdGUucmVtb3ZlQ2xhc3MocG9zaXRpb24pXG4gICAgICAgICAgLmFkZENsYXNzKCdsZWZ0Jyk7XG4gICAgfSBlbHNlIGlmIChwb3NpdGlvbiA9PT0gJ2xlZnQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigncmlnaHQnKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpIHtcbiAgICAgIHRoaXMudGVtcGxhdGUucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xuICAgIH0gZWxzZSBpZiAocG9zaXRpb24gPT09ICdyaWdodCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA8IDApKSB7XG4gICAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcbiAgICB9XG4gICAgLy9pZiBub3RoaW5nIGNsZWFyZWQsIHNldCB0byBib3R0b21cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMudGVtcGxhdGUucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xuICAgIH1cbiAgICB0aGlzLmNsYXNzQ2hhbmdlZCA9IHRydWU7XG4gICAgdGhpcy5jb3VudGVyLS07XG4gIH1cblxuICAvKipcbiAgICogc2V0cyB0aGUgcG9zaXRpb24gY2xhc3Mgb2YgYW4gZWxlbWVudCBhbmQgcmVjdXJzaXZlbHkgY2FsbHMgaXRzZWxmIHVudGlsIHRoZXJlIGFyZSBubyBtb3JlIHBvc3NpYmxlIHBvc2l0aW9ucyB0byBhdHRlbXB0LCBvciB0aGUgdG9vbHRpcCBlbGVtZW50IGlzIG5vIGxvbmdlciBjb2xsaWRpbmcuXG4gICAqIGlmIHRoZSB0b29sdGlwIGlzIGxhcmdlciB0aGFuIHRoZSBzY3JlZW4gd2lkdGgsIGRlZmF1bHQgdG8gZnVsbCB3aWR0aCAtIGFueSB1c2VyIHNlbGVjdGVkIG1hcmdpblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3NldFBvc2l0aW9uKCkge1xuICAgIHZhciBwb3NpdGlvbiA9IHRoaXMuX2dldFBvc2l0aW9uQ2xhc3ModGhpcy50ZW1wbGF0ZSksXG4gICAgICAgICR0aXBEaW1zID0gRm91bmRhdGlvbi5Cb3guR2V0RGltZW5zaW9ucyh0aGlzLnRlbXBsYXRlKSxcbiAgICAgICAgJGFuY2hvckRpbXMgPSBGb3VuZGF0aW9uLkJveC5HZXREaW1lbnNpb25zKHRoaXMuJGVsZW1lbnQpLFxuICAgICAgICBkaXJlY3Rpb24gPSAocG9zaXRpb24gPT09ICdsZWZ0JyA/ICdsZWZ0JyA6ICgocG9zaXRpb24gPT09ICdyaWdodCcpID8gJ2xlZnQnIDogJ3RvcCcpKSxcbiAgICAgICAgcGFyYW0gPSAoZGlyZWN0aW9uID09PSAndG9wJykgPyAnaGVpZ2h0JyA6ICd3aWR0aCcsXG4gICAgICAgIG9mZnNldCA9IChwYXJhbSA9PT0gJ2hlaWdodCcpID8gdGhpcy5vcHRpb25zLnZPZmZzZXQgOiB0aGlzLm9wdGlvbnMuaE9mZnNldCxcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xuXG4gICAgaWYgKCgkdGlwRGltcy53aWR0aCA+PSAkdGlwRGltcy53aW5kb3dEaW1zLndpZHRoKSB8fCAoIXRoaXMuY291bnRlciAmJiAhRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSh0aGlzLnRlbXBsYXRlKSkpIHtcbiAgICAgIHRoaXMudGVtcGxhdGUub2Zmc2V0KEZvdW5kYXRpb24uQm94LkdldE9mZnNldHModGhpcy50ZW1wbGF0ZSwgdGhpcy4kZWxlbWVudCwgJ2NlbnRlciBib3R0b20nLCB0aGlzLm9wdGlvbnMudk9mZnNldCwgdGhpcy5vcHRpb25zLmhPZmZzZXQsIHRydWUpKS5jc3Moe1xuICAgICAgLy8gdGhpcy4kZWxlbWVudC5vZmZzZXQoRm91bmRhdGlvbi5HZXRPZmZzZXRzKHRoaXMudGVtcGxhdGUsIHRoaXMuJGVsZW1lbnQsICdjZW50ZXIgYm90dG9tJywgdGhpcy5vcHRpb25zLnZPZmZzZXQsIHRoaXMub3B0aW9ucy5oT2Zmc2V0LCB0cnVlKSkuY3NzKHtcbiAgICAgICAgJ3dpZHRoJzogJGFuY2hvckRpbXMud2luZG93RGltcy53aWR0aCAtICh0aGlzLm9wdGlvbnMuaE9mZnNldCAqIDIpLFxuICAgICAgICAnaGVpZ2h0JzogJ2F1dG8nXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLnRlbXBsYXRlLm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMudGVtcGxhdGUsIHRoaXMuJGVsZW1lbnQsJ2NlbnRlciAnICsgKHBvc2l0aW9uIHx8ICdib3R0b20nKSwgdGhpcy5vcHRpb25zLnZPZmZzZXQsIHRoaXMub3B0aW9ucy5oT2Zmc2V0KSk7XG5cbiAgICB3aGlsZSghRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSh0aGlzLnRlbXBsYXRlKSAmJiB0aGlzLmNvdW50ZXIpIHtcbiAgICAgIHRoaXMuX3JlcG9zaXRpb24ocG9zaXRpb24pO1xuICAgICAgdGhpcy5fc2V0UG9zaXRpb24oKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogcmV2ZWFscyB0aGUgdG9vbHRpcCwgYW5kIGZpcmVzIGFuIGV2ZW50IHRvIGNsb3NlIGFueSBvdGhlciBvcGVuIHRvb2x0aXBzIG9uIHRoZSBwYWdlXG4gICAqIEBmaXJlcyBUb29sdGlwI2Nsb3NlbWVcbiAgICogQGZpcmVzIFRvb2x0aXAjc2hvd1xuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHNob3coKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5zaG93T24gIT09ICdhbGwnICYmICFGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdCh0aGlzLm9wdGlvbnMuc2hvd09uKSkge1xuICAgICAgLy8gY29uc29sZS5lcnJvcignVGhlIHNjcmVlbiBpcyB0b28gc21hbGwgdG8gZGlzcGxheSB0aGlzIHRvb2x0aXAnKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMudGVtcGxhdGUuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpLnNob3coKTtcbiAgICB0aGlzLl9zZXRQb3NpdGlvbigpO1xuXG4gICAgLyoqXG4gICAgICogRmlyZXMgdG8gY2xvc2UgYWxsIG90aGVyIG9wZW4gdG9vbHRpcHMgb24gdGhlIHBhZ2VcbiAgICAgKiBAZXZlbnQgQ2xvc2VtZSN0b29sdGlwXG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdjbG9zZW1lLnpmLnRvb2x0aXAnLCB0aGlzLnRlbXBsYXRlLmF0dHIoJ2lkJykpO1xuXG5cbiAgICB0aGlzLnRlbXBsYXRlLmF0dHIoe1xuICAgICAgJ2RhdGEtaXMtYWN0aXZlJzogdHJ1ZSxcbiAgICAgICdhcmlhLWhpZGRlbic6IGZhbHNlXG4gICAgfSk7XG4gICAgX3RoaXMuaXNBY3RpdmUgPSB0cnVlO1xuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMudGVtcGxhdGUpO1xuICAgIHRoaXMudGVtcGxhdGUuc3RvcCgpLmhpZGUoKS5jc3MoJ3Zpc2liaWxpdHknLCAnJykuZmFkZUluKHRoaXMub3B0aW9ucy5mYWRlSW5EdXJhdGlvbiwgZnVuY3Rpb24oKSB7XG4gICAgICAvL21heWJlIGRvIHN0dWZmP1xuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIHRvb2x0aXAgaXMgc2hvd25cbiAgICAgKiBAZXZlbnQgVG9vbHRpcCNzaG93XG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdzaG93LnpmLnRvb2x0aXAnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIaWRlcyB0aGUgY3VycmVudCB0b29sdGlwLCBhbmQgcmVzZXRzIHRoZSBwb3NpdGlvbmluZyBjbGFzcyBpZiBpdCB3YXMgY2hhbmdlZCBkdWUgdG8gY29sbGlzaW9uXG4gICAqIEBmaXJlcyBUb29sdGlwI2hpZGVcbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBoaWRlKCkge1xuICAgIC8vIGNvbnNvbGUubG9nKCdoaWRpbmcnLCB0aGlzLiRlbGVtZW50LmRhdGEoJ3lldGktYm94JykpO1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy50ZW1wbGF0ZS5zdG9wKCkuYXR0cih7XG4gICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxuICAgICAgJ2RhdGEtaXMtYWN0aXZlJzogZmFsc2VcbiAgICB9KS5mYWRlT3V0KHRoaXMub3B0aW9ucy5mYWRlT3V0RHVyYXRpb24sIGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMuaXNBY3RpdmUgPSBmYWxzZTtcbiAgICAgIF90aGlzLmlzQ2xpY2sgPSBmYWxzZTtcbiAgICAgIGlmIChfdGhpcy5jbGFzc0NoYW5nZWQpIHtcbiAgICAgICAgX3RoaXMudGVtcGxhdGVcbiAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoX3RoaXMuX2dldFBvc2l0aW9uQ2xhc3MoX3RoaXMudGVtcGxhdGUpKVxuICAgICAgICAgICAgIC5hZGRDbGFzcyhfdGhpcy5vcHRpb25zLnBvc2l0aW9uQ2xhc3MpO1xuXG4gICAgICAgX3RoaXMudXNlZFBvc2l0aW9ucyA9IFtdO1xuICAgICAgIF90aGlzLmNvdW50ZXIgPSA0O1xuICAgICAgIF90aGlzLmNsYXNzQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8qKlxuICAgICAqIGZpcmVzIHdoZW4gdGhlIHRvb2x0aXAgaXMgaGlkZGVuXG4gICAgICogQGV2ZW50IFRvb2x0aXAjaGlkZVxuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignaGlkZS56Zi50b29sdGlwJyk7XG4gIH1cblxuICAvKipcbiAgICogYWRkcyBldmVudCBsaXN0ZW5lcnMgZm9yIHRoZSB0b29sdGlwIGFuZCBpdHMgYW5jaG9yXG4gICAqIFRPRE8gY29tYmluZSBzb21lIG9mIHRoZSBsaXN0ZW5lcnMgbGlrZSBmb2N1cyBhbmQgbW91c2VlbnRlciwgZXRjLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHZhciAkdGVtcGxhdGUgPSB0aGlzLnRlbXBsYXRlO1xuICAgIHZhciBpc0ZvY3VzID0gZmFsc2U7XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5kaXNhYmxlSG92ZXIpIHtcblxuICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgLm9uKCdtb3VzZWVudGVyLnpmLnRvb2x0aXAnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmICghX3RoaXMuaXNBY3RpdmUpIHtcbiAgICAgICAgICBfdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIF90aGlzLnNob3coKTtcbiAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLm9uKCdtb3VzZWxlYXZlLnpmLnRvb2x0aXAnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcbiAgICAgICAgaWYgKCFpc0ZvY3VzIHx8ICghX3RoaXMuaXNDbGljayAmJiBfdGhpcy5vcHRpb25zLmNsaWNrT3BlbikpIHtcbiAgICAgICAgICBfdGhpcy5oaWRlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xpY2tPcGVuKSB7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCdtb3VzZWRvd24uemYudG9vbHRpcCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgaWYgKF90aGlzLmlzQ2xpY2spIHtcbiAgICAgICAgICBfdGhpcy5oaWRlKCk7XG4gICAgICAgICAgLy8gX3RoaXMuaXNDbGljayA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF90aGlzLmlzQ2xpY2sgPSB0cnVlO1xuICAgICAgICAgIGlmICgoX3RoaXMub3B0aW9ucy5kaXNhYmxlSG92ZXIgfHwgIV90aGlzLiRlbGVtZW50LmF0dHIoJ3RhYmluZGV4JykpICYmICFfdGhpcy5pc0FjdGl2ZSkge1xuICAgICAgICAgICAgX3RoaXMuc2hvdygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuZGlzYWJsZUZvclRvdWNoKSB7XG4gICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAub24oJ3RhcC56Zi50b29sdGlwIHRvdWNoZW5kLnpmLnRvb2x0aXAnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIF90aGlzLmlzQWN0aXZlID8gX3RoaXMuaGlkZSgpIDogX3RoaXMuc2hvdygpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy4kZWxlbWVudC5vbih7XG4gICAgICAvLyAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxuICAgICAgLy8gJ2Nsb3NlLnpmLnRyaWdnZXInOiB0aGlzLmhpZGUuYmluZCh0aGlzKVxuICAgICAgJ2Nsb3NlLnpmLnRyaWdnZXInOiB0aGlzLmhpZGUuYmluZCh0aGlzKVxuICAgIH0pO1xuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLm9uKCdmb2N1cy56Zi50b29sdGlwJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpc0ZvY3VzID0gdHJ1ZTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coX3RoaXMuaXNDbGljayk7XG4gICAgICAgIGlmIChfdGhpcy5pc0NsaWNrKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vICQod2luZG93KVxuICAgICAgICAgIF90aGlzLnNob3coKTtcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgLm9uKCdmb2N1c291dC56Zi50b29sdGlwJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpc0ZvY3VzID0gZmFsc2U7XG4gICAgICAgIF90aGlzLmlzQ2xpY2sgPSBmYWxzZTtcbiAgICAgICAgX3RoaXMuaGlkZSgpO1xuICAgICAgfSlcblxuICAgICAgLm9uKCdyZXNpemVtZS56Zi50cmlnZ2VyJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChfdGhpcy5pc0FjdGl2ZSkge1xuICAgICAgICAgIF90aGlzLl9zZXRQb3NpdGlvbigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBhZGRzIGEgdG9nZ2xlIG1ldGhvZCwgaW4gYWRkaXRpb24gdG8gdGhlIHN0YXRpYyBzaG93KCkgJiBoaWRlKCkgZnVuY3Rpb25zXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgdG9nZ2xlKCkge1xuICAgIGlmICh0aGlzLmlzQWN0aXZlKSB7XG4gICAgICB0aGlzLmhpZGUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zaG93KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIHRvb2x0aXAsIHJlbW92ZXMgdGVtcGxhdGUgZWxlbWVudCBmcm9tIHRoZSB2aWV3LlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCd0aXRsZScsIHRoaXMudGVtcGxhdGUudGV4dCgpKVxuICAgICAgICAgICAgICAgICAub2ZmKCcuemYudHJpZ2dlciAuemYudG9vdGlwJylcbiAgICAgICAgICAgICAgICAvLyAgLnJlbW92ZUNsYXNzKCdoYXMtdGlwJylcbiAgICAgICAgICAgICAgICAgLnJlbW92ZUF0dHIoJ2FyaWEtZGVzY3JpYmVkYnknKVxuICAgICAgICAgICAgICAgICAucmVtb3ZlQXR0cignZGF0YS15ZXRpLWJveCcpXG4gICAgICAgICAgICAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXRvZ2dsZScpXG4gICAgICAgICAgICAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXJlc2l6ZScpO1xuXG4gICAgdGhpcy50ZW1wbGF0ZS5yZW1vdmUoKTtcblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG5Ub29sdGlwLmRlZmF1bHRzID0ge1xuICBkaXNhYmxlRm9yVG91Y2g6IGZhbHNlLFxuICAvKipcbiAgICogVGltZSwgaW4gbXMsIGJlZm9yZSBhIHRvb2x0aXAgc2hvdWxkIG9wZW4gb24gaG92ZXIuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMjAwXG4gICAqL1xuICBob3ZlckRlbGF5OiAyMDAsXG4gIC8qKlxuICAgKiBUaW1lLCBpbiBtcywgYSB0b29sdGlwIHNob3VsZCB0YWtlIHRvIGZhZGUgaW50byB2aWV3LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDE1MFxuICAgKi9cbiAgZmFkZUluRHVyYXRpb246IDE1MCxcbiAgLyoqXG4gICAqIFRpbWUsIGluIG1zLCBhIHRvb2x0aXAgc2hvdWxkIHRha2UgdG8gZmFkZSBvdXQgb2Ygdmlldy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAxNTBcbiAgICovXG4gIGZhZGVPdXREdXJhdGlvbjogMTUwLFxuICAvKipcbiAgICogRGlzYWJsZXMgaG92ZXIgZXZlbnRzIGZyb20gb3BlbmluZyB0aGUgdG9vbHRpcCBpZiBzZXQgdG8gdHJ1ZVxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBkaXNhYmxlSG92ZXI6IGZhbHNlLFxuICAvKipcbiAgICogT3B0aW9uYWwgYWRkdGlvbmFsIGNsYXNzZXMgdG8gYXBwbHkgdG8gdGhlIHRvb2x0aXAgdGVtcGxhdGUgb24gaW5pdC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnbXktY29vbC10aXAtY2xhc3MnXG4gICAqL1xuICB0ZW1wbGF0ZUNsYXNzZXM6ICcnLFxuICAvKipcbiAgICogTm9uLW9wdGlvbmFsIGNsYXNzIGFkZGVkIHRvIHRvb2x0aXAgdGVtcGxhdGVzLiBGb3VuZGF0aW9uIGRlZmF1bHQgaXMgJ3Rvb2x0aXAnLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICd0b29sdGlwJ1xuICAgKi9cbiAgdG9vbHRpcENsYXNzOiAndG9vbHRpcCcsXG4gIC8qKlxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHRoZSB0b29sdGlwIGFuY2hvciBlbGVtZW50LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdoYXMtdGlwJ1xuICAgKi9cbiAgdHJpZ2dlckNsYXNzOiAnaGFzLXRpcCcsXG4gIC8qKlxuICAgKiBNaW5pbXVtIGJyZWFrcG9pbnQgc2l6ZSBhdCB3aGljaCB0byBvcGVuIHRoZSB0b29sdGlwLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdzbWFsbCdcbiAgICovXG4gIHNob3dPbjogJ3NtYWxsJyxcbiAgLyoqXG4gICAqIEN1c3RvbSB0ZW1wbGF0ZSB0byBiZSB1c2VkIHRvIGdlbmVyYXRlIG1hcmt1cCBmb3IgdG9vbHRpcC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnJmx0O2RpdiBjbGFzcz1cInRvb2x0aXBcIiZndDsmbHQ7L2RpdiZndDsnXG4gICAqL1xuICB0ZW1wbGF0ZTogJycsXG4gIC8qKlxuICAgKiBUZXh0IGRpc3BsYXllZCBpbiB0aGUgdG9vbHRpcCB0ZW1wbGF0ZSBvbiBvcGVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdTb21lIGNvb2wgc3BhY2UgZmFjdCBoZXJlLidcbiAgICovXG4gIHRpcFRleHQ6ICcnLFxuICB0b3VjaENsb3NlVGV4dDogJ1RhcCB0byBjbG9zZS4nLFxuICAvKipcbiAgICogQWxsb3dzIHRoZSB0b29sdGlwIHRvIHJlbWFpbiBvcGVuIGlmIHRyaWdnZXJlZCB3aXRoIGEgY2xpY2sgb3IgdG91Y2ggZXZlbnQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgY2xpY2tPcGVuOiB0cnVlLFxuICAvKipcbiAgICogQWRkaXRpb25hbCBwb3NpdGlvbmluZyBjbGFzc2VzLCBzZXQgYnkgdGhlIEpTXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ3RvcCdcbiAgICovXG4gIHBvc2l0aW9uQ2xhc3M6ICcnLFxuICAvKipcbiAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIHRlbXBsYXRlIHNob3VsZCBwdXNoIGF3YXkgZnJvbSB0aGUgYW5jaG9yIG9uIHRoZSBZIGF4aXMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMTBcbiAgICovXG4gIHZPZmZzZXQ6IDEwLFxuICAvKipcbiAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIHRlbXBsYXRlIHNob3VsZCBwdXNoIGF3YXkgZnJvbSB0aGUgYW5jaG9yIG9uIHRoZSBYIGF4aXMsIGlmIGFsaWduZWQgdG8gYSBzaWRlLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDEyXG4gICAqL1xuICBoT2Zmc2V0OiAxMlxufTtcblxuLyoqXG4gKiBUT0RPIHV0aWxpemUgcmVzaXplIGV2ZW50IHRyaWdnZXJcbiAqL1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oVG9vbHRpcCwgJ1Rvb2x0aXAnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBQb2x5ZmlsbCBmb3IgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4oZnVuY3Rpb24oKSB7XG4gIGlmICghRGF0ZS5ub3cpXG4gICAgRGF0ZS5ub3cgPSBmdW5jdGlvbigpIHsgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpOyB9O1xuXG4gIHZhciB2ZW5kb3JzID0gWyd3ZWJraXQnLCAnbW96J107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdmVuZG9ycy5sZW5ndGggJiYgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7ICsraSkge1xuICAgICAgdmFyIHZwID0gdmVuZG9yc1tpXTtcbiAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3dbdnArJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gKHdpbmRvd1t2cCsnQ2FuY2VsQW5pbWF0aW9uRnJhbWUnXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgd2luZG93W3ZwKydDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXSk7XG4gIH1cbiAgaWYgKC9pUChhZHxob25lfG9kKS4qT1MgNi8udGVzdCh3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudClcbiAgICB8fCAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCAhd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgdmFyIGxhc3RUaW1lID0gMDtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIHZhciBuZXh0VGltZSA9IE1hdGgubWF4KGxhc3RUaW1lICsgMTYsIG5vdyk7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayhsYXN0VGltZSA9IG5leHRUaW1lKTsgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFRpbWUgLSBub3cpO1xuICAgIH07XG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gY2xlYXJUaW1lb3V0O1xuICB9XG59KSgpO1xuXG52YXIgaW5pdENsYXNzZXMgICA9IFsnbXVpLWVudGVyJywgJ211aS1sZWF2ZSddO1xudmFyIGFjdGl2ZUNsYXNzZXMgPSBbJ211aS1lbnRlci1hY3RpdmUnLCAnbXVpLWxlYXZlLWFjdGl2ZSddO1xuXG4vLyBGaW5kIHRoZSByaWdodCBcInRyYW5zaXRpb25lbmRcIiBldmVudCBmb3IgdGhpcyBicm93c2VyXG52YXIgZW5kRXZlbnQgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciB0cmFuc2l0aW9ucyA9IHtcbiAgICAndHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAnV2Via2l0VHJhbnNpdGlvbic6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAnTW96VHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAnT1RyYW5zaXRpb24nOiAnb3RyYW5zaXRpb25lbmQnXG4gIH1cbiAgdmFyIGVsZW0gPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgZm9yICh2YXIgdCBpbiB0cmFuc2l0aW9ucykge1xuICAgIGlmICh0eXBlb2YgZWxlbS5zdHlsZVt0XSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiB0cmFuc2l0aW9uc1t0XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn0pKCk7XG5cbmZ1bmN0aW9uIGFuaW1hdGUoaXNJbiwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICBlbGVtZW50ID0gJChlbGVtZW50KS5lcSgwKTtcblxuICBpZiAoIWVsZW1lbnQubGVuZ3RoKSByZXR1cm47XG5cbiAgaWYgKGVuZEV2ZW50ID09PSBudWxsKSB7XG4gICAgaXNJbiA/IGVsZW1lbnQuc2hvdygpIDogZWxlbWVudC5oaWRlKCk7XG4gICAgY2IoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgaW5pdENsYXNzID0gaXNJbiA/IGluaXRDbGFzc2VzWzBdIDogaW5pdENsYXNzZXNbMV07XG4gIHZhciBhY3RpdmVDbGFzcyA9IGlzSW4gPyBhY3RpdmVDbGFzc2VzWzBdIDogYWN0aXZlQ2xhc3Nlc1sxXTtcblxuICAvLyBTZXQgdXAgdGhlIGFuaW1hdGlvblxuICByZXNldCgpO1xuICBlbGVtZW50LmFkZENsYXNzKGFuaW1hdGlvbik7XG4gIGVsZW1lbnQuY3NzKCd0cmFuc2l0aW9uJywgJ25vbmUnKTtcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgIGVsZW1lbnQuYWRkQ2xhc3MoaW5pdENsYXNzKTtcbiAgICBpZiAoaXNJbikgZWxlbWVudC5zaG93KCk7XG4gIH0pO1xuXG4gIC8vIFN0YXJ0IHRoZSBhbmltYXRpb25cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgIGVsZW1lbnRbMF0ub2Zmc2V0V2lkdGg7XG4gICAgZWxlbWVudC5jc3MoJ3RyYW5zaXRpb24nLCAnJyk7XG4gICAgZWxlbWVudC5hZGRDbGFzcyhhY3RpdmVDbGFzcyk7XG4gIH0pO1xuXG4gIC8vIENsZWFuIHVwIHRoZSBhbmltYXRpb24gd2hlbiBpdCBmaW5pc2hlc1xuICBlbGVtZW50Lm9uZSgndHJhbnNpdGlvbmVuZCcsIGZpbmlzaCk7XG5cbiAgLy8gSGlkZXMgdGhlIGVsZW1lbnQgKGZvciBvdXQgYW5pbWF0aW9ucyksIHJlc2V0cyB0aGUgZWxlbWVudCwgYW5kIHJ1bnMgYSBjYWxsYmFja1xuICBmdW5jdGlvbiBmaW5pc2goKSB7XG4gICAgaWYgKCFpc0luKSBlbGVtZW50LmhpZGUoKTtcbiAgICByZXNldCgpO1xuICAgIGlmIChjYikgY2IuYXBwbHkoZWxlbWVudCk7XG4gIH1cblxuICAvLyBSZXNldHMgdHJhbnNpdGlvbnMgYW5kIHJlbW92ZXMgbW90aW9uLXNwZWNpZmljIGNsYXNzZXNcbiAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgZWxlbWVudFswXS5zdHlsZS50cmFuc2l0aW9uRHVyYXRpb24gPSAwO1xuICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoaW5pdENsYXNzICsgJyAnICsgYWN0aXZlQ2xhc3MgKyAnICcgKyBhbmltYXRpb24pO1xuICB9XG59XG5cbnZhciBNb3Rpb25VSSA9IHtcbiAgYW5pbWF0ZUluOiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZSh0cnVlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcbiAgfSxcblxuICBhbmltYXRlT3V0OiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZShmYWxzZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XG4gIH1cbn1cbiIsIi8qISBza3JvbGxyIDAuNi4zMCAoMjAxNS0wNi0xOSkgfCBBbGV4YW5kZXIgUHJpbnpob3JuIC0gaHR0cHM6Ly9naXRodWIuY29tL1ByaW56aG9ybi9za3JvbGxyIHwgRnJlZSB0byB1c2UgdW5kZXIgdGVybXMgb2YgTUlUIGxpY2Vuc2UgKi9cbiFmdW5jdGlvbihhLGIsYyl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZChjKXtpZihlPWIuZG9jdW1lbnRFbGVtZW50LGY9Yi5ib2R5LFQoKSxoYT10aGlzLGM9Y3x8e30sbWE9Yy5jb25zdGFudHN8fHt9LGMuZWFzaW5nKWZvcih2YXIgZCBpbiBjLmVhc2luZylXW2RdPWMuZWFzaW5nW2RdO3RhPWMuZWRnZVN0cmF0ZWd5fHxcInNldFwiLGthPXtiZWZvcmVyZW5kZXI6Yy5iZWZvcmVyZW5kZXIscmVuZGVyOmMucmVuZGVyLGtleWZyYW1lOmMua2V5ZnJhbWV9LGxhPWMuZm9yY2VIZWlnaHQhPT0hMSxsYSYmKEthPWMuc2NhbGV8fDEpLG5hPWMubW9iaWxlRGVjZWxlcmF0aW9ufHx5LHBhPWMuc21vb3RoU2Nyb2xsaW5nIT09ITEscWE9Yy5zbW9vdGhTY3JvbGxpbmdEdXJhdGlvbnx8QSxyYT17dGFyZ2V0VG9wOmhhLmdldFNjcm9sbFRvcCgpfSxTYT0oYy5tb2JpbGVDaGVja3x8ZnVuY3Rpb24oKXtyZXR1cm4vQW5kcm9pZHxpUGhvbmV8aVBhZHxpUG9kfEJsYWNrQmVycnkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnR8fG5hdmlnYXRvci52ZW5kb3J8fGEub3BlcmEpfSkoKSxTYT8oamE9Yi5nZXRFbGVtZW50QnlJZChjLnNrcm9sbHJCb2R5fHx6KSxqYSYmZ2EoKSxYKCksRWEoZSxbcyx2XSxbdF0pKTpFYShlLFtzLHVdLFt0XSksaGEucmVmcmVzaCgpLHdhKGEsXCJyZXNpemUgb3JpZW50YXRpb25jaGFuZ2VcIixmdW5jdGlvbigpe3ZhciBhPWUuY2xpZW50V2lkdGgsYj1lLmNsaWVudEhlaWdodDsoYiE9PVBhfHxhIT09T2EpJiYoUGE9YixPYT1hLFFhPSEwKX0pO3ZhciBnPVUoKTtyZXR1cm4gZnVuY3Rpb24gaCgpeyQoKSx2YT1nKGgpfSgpLGhhfXZhciBlLGYsZz17Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGhhfSxpbml0OmZ1bmN0aW9uKGEpe3JldHVybiBoYXx8bmV3IGQoYSl9LFZFUlNJT046XCIwLjYuMjlcIn0saD1PYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LGk9YS5NYXRoLGo9YS5nZXRDb21wdXRlZFN0eWxlLGs9XCJ0b3VjaHN0YXJ0XCIsbD1cInRvdWNobW92ZVwiLG09XCJ0b3VjaGNhbmNlbFwiLG49XCJ0b3VjaGVuZFwiLG89XCJza3JvbGxhYmxlXCIscD1vK1wiLWJlZm9yZVwiLHE9bytcIi1iZXR3ZWVuXCIscj1vK1wiLWFmdGVyXCIscz1cInNrcm9sbHJcIix0PVwibm8tXCIrcyx1PXMrXCItZGVza3RvcFwiLHY9cytcIi1tb2JpbGVcIix3PVwibGluZWFyXCIseD0xZTMseT0uMDA0LHo9XCJza3JvbGxyLWJvZHlcIixBPTIwMCxCPVwic3RhcnRcIixDPVwiZW5kXCIsRD1cImNlbnRlclwiLEU9XCJib3R0b21cIixGPVwiX19fc2tyb2xsYWJsZV9pZFwiLEc9L14oPzppbnB1dHx0ZXh0YXJlYXxidXR0b258c2VsZWN0KSQvaSxIPS9eXFxzK3xcXHMrJC9nLEk9L15kYXRhKD86LShfXFx3KykpPyg/Oi0/KC0/XFxkKlxcLj9cXGQrcD8pKT8oPzotPyhzdGFydHxlbmR8dG9wfGNlbnRlcnxib3R0b20pKT8oPzotPyh0b3B8Y2VudGVyfGJvdHRvbSkpPyQvLEo9L1xccyooQD9bXFx3XFwtXFxbXFxdXSspXFxzKjpcXHMqKC4rPylcXHMqKD86O3wkKS9naSxLPS9eKEA/W2EtelxcLV0rKVxcWyhcXHcrKVxcXSQvLEw9Ly0oW2EtejAtOV9dKS9nLE09ZnVuY3Rpb24oYSxiKXtyZXR1cm4gYi50b1VwcGVyQ2FzZSgpfSxOPS9bXFwtK10/W1xcZF0qXFwuP1tcXGRdKy9nLE89L1xce1xcP1xcfS9nLFA9L3JnYmE/XFwoXFxzKi0/XFxkK1xccyosXFxzKi0/XFxkK1xccyosXFxzKi0/XFxkKy9nLFE9L1thLXpcXC1dKy1ncmFkaWVudC9nLFI9XCJcIixTPVwiXCIsVD1mdW5jdGlvbigpe3ZhciBhPS9eKD86T3xNb3p8d2Via2l0fG1zKXwoPzotKD86b3xtb3p8d2Via2l0fG1zKS0pLztpZihqKXt2YXIgYj1qKGYsbnVsbCk7Zm9yKHZhciBjIGluIGIpaWYoUj1jLm1hdGNoKGEpfHwrYz09YyYmYltjXS5tYXRjaChhKSlicmVhaztpZighUilyZXR1cm4gdm9pZChSPVM9XCJcIik7Uj1SWzBdLFwiLVwiPT09Ui5zbGljZSgwLDEpPyhTPVIsUj17XCItd2Via2l0LVwiOlwid2Via2l0XCIsXCItbW96LVwiOlwiTW96XCIsXCItbXMtXCI6XCJtc1wiLFwiLW8tXCI6XCJPXCJ9W1JdKTpTPVwiLVwiK1IudG9Mb3dlckNhc2UoKStcIi1cIn19LFU9ZnVuY3Rpb24oKXt2YXIgYj1hLnJlcXVlc3RBbmltYXRpb25GcmFtZXx8YVtSLnRvTG93ZXJDYXNlKCkrXCJSZXF1ZXN0QW5pbWF0aW9uRnJhbWVcIl0sYz1IYSgpO3JldHVybihTYXx8IWIpJiYoYj1mdW5jdGlvbihiKXt2YXIgZD1IYSgpLWMsZT1pLm1heCgwLDFlMy82MC1kKTtyZXR1cm4gYS5zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7Yz1IYSgpLGIoKX0sZSl9KSxifSxWPWZ1bmN0aW9uKCl7dmFyIGI9YS5jYW5jZWxBbmltYXRpb25GcmFtZXx8YVtSLnRvTG93ZXJDYXNlKCkrXCJDYW5jZWxBbmltYXRpb25GcmFtZVwiXTtyZXR1cm4oU2F8fCFiKSYmKGI9ZnVuY3Rpb24oYil7cmV0dXJuIGEuY2xlYXJUaW1lb3V0KGIpfSksYn0sVz17YmVnaW46ZnVuY3Rpb24oKXtyZXR1cm4gMH0sZW5kOmZ1bmN0aW9uKCl7cmV0dXJuIDF9LGxpbmVhcjpmdW5jdGlvbihhKXtyZXR1cm4gYX0scXVhZHJhdGljOmZ1bmN0aW9uKGEpe3JldHVybiBhKmF9LGN1YmljOmZ1bmN0aW9uKGEpe3JldHVybiBhKmEqYX0sc3dpbmc6ZnVuY3Rpb24oYSl7cmV0dXJuLWkuY29zKGEqaS5QSSkvMisuNX0sc3FydDpmdW5jdGlvbihhKXtyZXR1cm4gaS5zcXJ0KGEpfSxvdXRDdWJpYzpmdW5jdGlvbihhKXtyZXR1cm4gaS5wb3coYS0xLDMpKzF9LGJvdW5jZTpmdW5jdGlvbihhKXt2YXIgYjtpZiguNTA4Mz49YSliPTM7ZWxzZSBpZiguODQ4OT49YSliPTk7ZWxzZSBpZiguOTYyMDg+PWEpYj0yNztlbHNle2lmKCEoLjk5OTgxPj1hKSlyZXR1cm4gMTtiPTkxfXJldHVybiAxLWkuYWJzKDMqaS5jb3MoYSpiKjEuMDI4KS9iKX19O2QucHJvdG90eXBlLnJlZnJlc2g9ZnVuY3Rpb24oYSl7dmFyIGQsZSxmPSExO2ZvcihhPT09Yz8oZj0hMCxpYT1bXSxSYT0wLGE9Yi5nZXRFbGVtZW50c0J5VGFnTmFtZShcIipcIikpOmEubGVuZ3RoPT09YyYmKGE9W2FdKSxkPTAsZT1hLmxlbmd0aDtlPmQ7ZCsrKXt2YXIgZz1hW2RdLGg9ZyxpPVtdLGo9cGEsaz10YSxsPSExO2lmKGYmJkYgaW4gZyYmZGVsZXRlIGdbRl0sZy5hdHRyaWJ1dGVzKXtmb3IodmFyIG09MCxuPWcuYXR0cmlidXRlcy5sZW5ndGg7bj5tO20rKyl7dmFyIHA9Zy5hdHRyaWJ1dGVzW21dO2lmKFwiZGF0YS1hbmNob3ItdGFyZ2V0XCIhPT1wLm5hbWUpaWYoXCJkYXRhLXNtb290aC1zY3JvbGxpbmdcIiE9PXAubmFtZSlpZihcImRhdGEtZWRnZS1zdHJhdGVneVwiIT09cC5uYW1lKWlmKFwiZGF0YS1lbWl0LWV2ZW50c1wiIT09cC5uYW1lKXt2YXIgcT1wLm5hbWUubWF0Y2goSSk7aWYobnVsbCE9PXEpe3ZhciByPXtwcm9wczpwLnZhbHVlLGVsZW1lbnQ6ZyxldmVudFR5cGU6cC5uYW1lLnJlcGxhY2UoTCxNKX07aS5wdXNoKHIpO3ZhciBzPXFbMV07cyYmKHIuY29uc3RhbnQ9cy5zdWJzdHIoMSkpO3ZhciB0PXFbMl07L3AkLy50ZXN0KHQpPyhyLmlzUGVyY2VudGFnZT0hMCxyLm9mZnNldD0oMHx0LnNsaWNlKDAsLTEpKS8xMDApOnIub2Zmc2V0PTB8dDt2YXIgdT1xWzNdLHY9cVs0XXx8dTt1JiZ1IT09QiYmdSE9PUM/KHIubW9kZT1cInJlbGF0aXZlXCIsci5hbmNob3JzPVt1LHZdKTooci5tb2RlPVwiYWJzb2x1dGVcIix1PT09Qz9yLmlzRW5kPSEwOnIuaXNQZXJjZW50YWdlfHwoci5vZmZzZXQ9ci5vZmZzZXQqS2EpKX19ZWxzZSBsPSEwO2Vsc2Ugaz1wLnZhbHVlO2Vsc2Ugaj1cIm9mZlwiIT09cC52YWx1ZTtlbHNlIGlmKGg9Yi5xdWVyeVNlbGVjdG9yKHAudmFsdWUpLG51bGw9PT1oKXRocm93J1VuYWJsZSB0byBmaW5kIGFuY2hvciB0YXJnZXQgXCInK3AudmFsdWUrJ1wiJ31pZihpLmxlbmd0aCl7dmFyIHcseCx5OyFmJiZGIGluIGc/KHk9Z1tGXSx3PWlhW3ldLnN0eWxlQXR0cix4PWlhW3ldLmNsYXNzQXR0cik6KHk9Z1tGXT1SYSsrLHc9Zy5zdHlsZS5jc3NUZXh0LHg9RGEoZykpLGlhW3ldPXtlbGVtZW50Omcsc3R5bGVBdHRyOncsY2xhc3NBdHRyOngsYW5jaG9yVGFyZ2V0Omgsa2V5RnJhbWVzOmksc21vb3RoU2Nyb2xsaW5nOmosZWRnZVN0cmF0ZWd5OmssZW1pdEV2ZW50czpsLGxhc3RGcmFtZUluZGV4Oi0xfSxFYShnLFtvXSxbXSl9fX1mb3IoQWEoKSxkPTAsZT1hLmxlbmd0aDtlPmQ7ZCsrKXt2YXIgej1pYVthW2RdW0ZdXTt6IT09YyYmKF8oeiksYmEoeikpfXJldHVybiBoYX0sZC5wcm90b3R5cGUucmVsYXRpdmVUb0Fic29sdXRlPWZ1bmN0aW9uKGEsYixjKXt2YXIgZD1lLmNsaWVudEhlaWdodCxmPWEuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksZz1mLnRvcCxoPWYuYm90dG9tLWYudG9wO3JldHVybiBiPT09RT9nLT1kOmI9PT1EJiYoZy09ZC8yKSxjPT09RT9nKz1oOmM9PT1EJiYoZys9aC8yKSxnKz1oYS5nZXRTY3JvbGxUb3AoKSxnKy41fDB9LGQucHJvdG90eXBlLmFuaW1hdGVUbz1mdW5jdGlvbihhLGIpe2I9Ynx8e307dmFyIGQ9SGEoKSxlPWhhLmdldFNjcm9sbFRvcCgpLGY9Yi5kdXJhdGlvbj09PWM/eDpiLmR1cmF0aW9uO3JldHVybiBvYT17c3RhcnRUb3A6ZSx0b3BEaWZmOmEtZSx0YXJnZXRUb3A6YSxkdXJhdGlvbjpmLHN0YXJ0VGltZTpkLGVuZFRpbWU6ZCtmLGVhc2luZzpXW2IuZWFzaW5nfHx3XSxkb25lOmIuZG9uZX0sb2EudG9wRGlmZnx8KG9hLmRvbmUmJm9hLmRvbmUuY2FsbChoYSwhMSksb2E9YyksaGF9LGQucHJvdG90eXBlLnN0b3BBbmltYXRlVG89ZnVuY3Rpb24oKXtvYSYmb2EuZG9uZSYmb2EuZG9uZS5jYWxsKGhhLCEwKSxvYT1jfSxkLnByb3RvdHlwZS5pc0FuaW1hdGluZ1RvPWZ1bmN0aW9uKCl7cmV0dXJuISFvYX0sZC5wcm90b3R5cGUuaXNNb2JpbGU9ZnVuY3Rpb24oKXtyZXR1cm4gU2F9LGQucHJvdG90eXBlLnNldFNjcm9sbFRvcD1mdW5jdGlvbihiLGMpe3JldHVybiBzYT1jPT09ITAsU2E/VGE9aS5taW4oaS5tYXgoYiwwKSxKYSk6YS5zY3JvbGxUbygwLGIpLGhhfSxkLnByb3RvdHlwZS5nZXRTY3JvbGxUb3A9ZnVuY3Rpb24oKXtyZXR1cm4gU2E/VGE6YS5wYWdlWU9mZnNldHx8ZS5zY3JvbGxUb3B8fGYuc2Nyb2xsVG9wfHwwfSxkLnByb3RvdHlwZS5nZXRNYXhTY3JvbGxUb3A9ZnVuY3Rpb24oKXtyZXR1cm4gSmF9LGQucHJvdG90eXBlLm9uPWZ1bmN0aW9uKGEsYil7cmV0dXJuIGthW2FdPWIsaGF9LGQucHJvdG90eXBlLm9mZj1mdW5jdGlvbihhKXtyZXR1cm4gZGVsZXRlIGthW2FdLGhhfSxkLnByb3RvdHlwZS5kZXN0cm95PWZ1bmN0aW9uKCl7dmFyIGE9VigpO2EodmEpLHlhKCksRWEoZSxbdF0sW3MsdSx2XSk7Zm9yKHZhciBiPTAsZD1pYS5sZW5ndGg7ZD5iO2IrKylmYShpYVtiXS5lbGVtZW50KTtlLnN0eWxlLm92ZXJmbG93PWYuc3R5bGUub3ZlcmZsb3c9XCJcIixlLnN0eWxlLmhlaWdodD1mLnN0eWxlLmhlaWdodD1cIlwiLGphJiZnLnNldFN0eWxlKGphLFwidHJhbnNmb3JtXCIsXCJub25lXCIpLGhhPWMsamE9YyxrYT1jLGxhPWMsSmE9MCxLYT0xLG1hPWMsbmE9YyxMYT1cImRvd25cIixNYT0tMSxPYT0wLFBhPTAsUWE9ITEsb2E9YyxwYT1jLHFhPWMscmE9YyxzYT1jLFJhPTAsdGE9YyxTYT0hMSxUYT0wLHVhPWN9O3ZhciBYPWZ1bmN0aW9uKCl7dmFyIGQsZyxoLGosbyxwLHEscixzLHQsdSx2O3dhKGUsW2ssbCxtLG5dLmpvaW4oXCIgXCIpLGZ1bmN0aW9uKGEpe3ZhciBlPWEuY2hhbmdlZFRvdWNoZXNbMF07Zm9yKGo9YS50YXJnZXQ7Mz09PWoubm9kZVR5cGU7KWo9ai5wYXJlbnROb2RlO3N3aXRjaChvPWUuY2xpZW50WSxwPWUuY2xpZW50WCx0PWEudGltZVN0YW1wLEcudGVzdChqLnRhZ05hbWUpfHxhLnByZXZlbnREZWZhdWx0KCksYS50eXBlKXtjYXNlIGs6ZCYmZC5ibHVyKCksaGEuc3RvcEFuaW1hdGVUbygpLGQ9aixnPXE9byxoPXAscz10O2JyZWFrO2Nhc2UgbDpHLnRlc3Qoai50YWdOYW1lKSYmYi5hY3RpdmVFbGVtZW50IT09aiYmYS5wcmV2ZW50RGVmYXVsdCgpLHI9by1xLHY9dC11LGhhLnNldFNjcm9sbFRvcChUYS1yLCEwKSxxPW8sdT10O2JyZWFrO2RlZmF1bHQ6Y2FzZSBtOmNhc2Ugbjp2YXIgZj1nLW8sdz1oLXAseD13KncrZipmO2lmKDQ5Pngpe2lmKCFHLnRlc3QoZC50YWdOYW1lKSl7ZC5mb2N1cygpO3ZhciB5PWIuY3JlYXRlRXZlbnQoXCJNb3VzZUV2ZW50c1wiKTt5LmluaXRNb3VzZUV2ZW50KFwiY2xpY2tcIiwhMCwhMCxhLnZpZXcsMSxlLnNjcmVlblgsZS5zY3JlZW5ZLGUuY2xpZW50WCxlLmNsaWVudFksYS5jdHJsS2V5LGEuYWx0S2V5LGEuc2hpZnRLZXksYS5tZXRhS2V5LDAsbnVsbCksZC5kaXNwYXRjaEV2ZW50KHkpfXJldHVybn1kPWM7dmFyIHo9ci92O3o9aS5tYXgoaS5taW4oeiwzKSwtMyk7dmFyIEE9aS5hYnMoei9uYSksQj16KkErLjUqbmEqQSpBLEM9aGEuZ2V0U2Nyb2xsVG9wKCktQixEPTA7Qz5KYT8oRD0oSmEtQykvQixDPUphKTowPkMmJihEPS1DL0IsQz0wKSxBKj0xLUQsaGEuYW5pbWF0ZVRvKEMrLjV8MCx7ZWFzaW5nOlwib3V0Q3ViaWNcIixkdXJhdGlvbjpBfSl9fSksYS5zY3JvbGxUbygwLDApLGUuc3R5bGUub3ZlcmZsb3c9Zi5zdHlsZS5vdmVyZmxvdz1cImhpZGRlblwifSxZPWZ1bmN0aW9uKCl7dmFyIGEsYixjLGQsZixnLGgsaixrLGwsbSxuPWUuY2xpZW50SGVpZ2h0LG89QmEoKTtmb3Ioaj0wLGs9aWEubGVuZ3RoO2s+ajtqKyspZm9yKGE9aWFbal0sYj1hLmVsZW1lbnQsYz1hLmFuY2hvclRhcmdldCxkPWEua2V5RnJhbWVzLGY9MCxnPWQubGVuZ3RoO2c+ZjtmKyspaD1kW2ZdLGw9aC5vZmZzZXQsbT1vW2guY29uc3RhbnRdfHwwLGguZnJhbWU9bCxoLmlzUGVyY2VudGFnZSYmKGwqPW4saC5mcmFtZT1sKSxcInJlbGF0aXZlXCI9PT1oLm1vZGUmJihmYShiKSxoLmZyYW1lPWhhLnJlbGF0aXZlVG9BYnNvbHV0ZShjLGguYW5jaG9yc1swXSxoLmFuY2hvcnNbMV0pLWwsZmEoYiwhMCkpLGguZnJhbWUrPW0sbGEmJiFoLmlzRW5kJiZoLmZyYW1lPkphJiYoSmE9aC5mcmFtZSk7Zm9yKEphPWkubWF4KEphLENhKCkpLGo9MCxrPWlhLmxlbmd0aDtrPmo7aisrKXtmb3IoYT1pYVtqXSxkPWEua2V5RnJhbWVzLGY9MCxnPWQubGVuZ3RoO2c+ZjtmKyspaD1kW2ZdLG09b1toLmNvbnN0YW50XXx8MCxoLmlzRW5kJiYoaC5mcmFtZT1KYS1oLm9mZnNldCttKTthLmtleUZyYW1lcy5zb3J0KElhKX19LFo9ZnVuY3Rpb24oYSxiKXtmb3IodmFyIGM9MCxkPWlhLmxlbmd0aDtkPmM7YysrKXt2YXIgZSxmLGk9aWFbY10saj1pLmVsZW1lbnQsaz1pLnNtb290aFNjcm9sbGluZz9hOmIsbD1pLmtleUZyYW1lcyxtPWwubGVuZ3RoLG49bFswXSxzPWxbbC5sZW5ndGgtMV0sdD1rPG4uZnJhbWUsdT1rPnMuZnJhbWUsdj10P246cyx3PWkuZW1pdEV2ZW50cyx4PWkubGFzdEZyYW1lSW5kZXg7aWYodHx8dSl7aWYodCYmLTE9PT1pLmVkZ2V8fHUmJjE9PT1pLmVkZ2UpY29udGludWU7c3dpdGNoKHQ/KEVhKGosW3BdLFtyLHFdKSx3JiZ4Pi0xJiYoemEoaixuLmV2ZW50VHlwZSxMYSksaS5sYXN0RnJhbWVJbmRleD0tMSkpOihFYShqLFtyXSxbcCxxXSksdyYmbT54JiYoemEoaixzLmV2ZW50VHlwZSxMYSksaS5sYXN0RnJhbWVJbmRleD1tKSksaS5lZGdlPXQ/LTE6MSxpLmVkZ2VTdHJhdGVneSl7Y2FzZVwicmVzZXRcIjpmYShqKTtjb250aW51ZTtjYXNlXCJlYXNlXCI6az12LmZyYW1lO2JyZWFrO2RlZmF1bHQ6Y2FzZVwic2V0XCI6dmFyIHk9di5wcm9wcztmb3IoZSBpbiB5KWguY2FsbCh5LGUpJiYoZj1lYSh5W2VdLnZhbHVlKSwwPT09ZS5pbmRleE9mKFwiQFwiKT9qLnNldEF0dHJpYnV0ZShlLnN1YnN0cigxKSxmKTpnLnNldFN0eWxlKGosZSxmKSk7Y29udGludWV9fWVsc2UgMCE9PWkuZWRnZSYmKEVhKGosW28scV0sW3Ascl0pLGkuZWRnZT0wKTtmb3IodmFyIHo9MDttLTE+ejt6KyspaWYoaz49bFt6XS5mcmFtZSYmazw9bFt6KzFdLmZyYW1lKXt2YXIgQT1sW3pdLEI9bFt6KzFdO2ZvcihlIGluIEEucHJvcHMpaWYoaC5jYWxsKEEucHJvcHMsZSkpe3ZhciBDPShrLUEuZnJhbWUpLyhCLmZyYW1lLUEuZnJhbWUpO0M9QS5wcm9wc1tlXS5lYXNpbmcoQyksZj1kYShBLnByb3BzW2VdLnZhbHVlLEIucHJvcHNbZV0udmFsdWUsQyksZj1lYShmKSwwPT09ZS5pbmRleE9mKFwiQFwiKT9qLnNldEF0dHJpYnV0ZShlLnN1YnN0cigxKSxmKTpnLnNldFN0eWxlKGosZSxmKX13JiZ4IT09eiYmKFwiZG93blwiPT09TGE/emEoaixBLmV2ZW50VHlwZSxMYSk6emEoaixCLmV2ZW50VHlwZSxMYSksaS5sYXN0RnJhbWVJbmRleD16KTticmVha319fSwkPWZ1bmN0aW9uKCl7UWEmJihRYT0hMSxBYSgpKTt2YXIgYSxiLGQ9aGEuZ2V0U2Nyb2xsVG9wKCksZT1IYSgpO2lmKG9hKWU+PW9hLmVuZFRpbWU/KGQ9b2EudGFyZ2V0VG9wLGE9b2EuZG9uZSxvYT1jKTooYj1vYS5lYXNpbmcoKGUtb2Euc3RhcnRUaW1lKS9vYS5kdXJhdGlvbiksZD1vYS5zdGFydFRvcCtiKm9hLnRvcERpZmZ8MCksaGEuc2V0U2Nyb2xsVG9wKGQsITApO2Vsc2UgaWYoIXNhKXt2YXIgZj1yYS50YXJnZXRUb3AtZDtmJiYocmE9e3N0YXJ0VG9wOk1hLHRvcERpZmY6ZC1NYSx0YXJnZXRUb3A6ZCxzdGFydFRpbWU6TmEsZW5kVGltZTpOYStxYX0pLGU8PXJhLmVuZFRpbWUmJihiPVcuc3FydCgoZS1yYS5zdGFydFRpbWUpL3FhKSxkPXJhLnN0YXJ0VG9wK2IqcmEudG9wRGlmZnwwKX1pZihzYXx8TWEhPT1kKXtMYT1kPk1hP1wiZG93blwiOk1hPmQ/XCJ1cFwiOkxhLHNhPSExO3ZhciBoPXtjdXJUb3A6ZCxsYXN0VG9wOk1hLG1heFRvcDpKYSxkaXJlY3Rpb246TGF9LGk9a2EuYmVmb3JlcmVuZGVyJiZrYS5iZWZvcmVyZW5kZXIuY2FsbChoYSxoKTtpIT09ITEmJihaKGQsaGEuZ2V0U2Nyb2xsVG9wKCkpLFNhJiZqYSYmZy5zZXRTdHlsZShqYSxcInRyYW5zZm9ybVwiLFwidHJhbnNsYXRlKDAsIFwiKy1UYStcInB4KSBcIit1YSksTWE9ZCxrYS5yZW5kZXImJmthLnJlbmRlci5jYWxsKGhhLGgpKSxhJiZhLmNhbGwoaGEsITEpfU5hPWV9LF89ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPTAsYz1hLmtleUZyYW1lcy5sZW5ndGg7Yz5iO2IrKyl7Zm9yKHZhciBkLGUsZixnLGg9YS5rZXlGcmFtZXNbYl0saT17fTtudWxsIT09KGc9Si5leGVjKGgucHJvcHMpKTspZj1nWzFdLGU9Z1syXSxkPWYubWF0Y2goSyksbnVsbCE9PWQ/KGY9ZFsxXSxkPWRbMl0pOmQ9dyxlPWUuaW5kZXhPZihcIiFcIik/YWEoZSk6W2Uuc2xpY2UoMSldLGlbZl09e3ZhbHVlOmUsZWFzaW5nOldbZF19O2gucHJvcHM9aX19LGFhPWZ1bmN0aW9uKGEpe3ZhciBiPVtdO3JldHVybiBQLmxhc3RJbmRleD0wLGE9YS5yZXBsYWNlKFAsZnVuY3Rpb24oYSl7cmV0dXJuIGEucmVwbGFjZShOLGZ1bmN0aW9uKGEpe3JldHVybiBhLzI1NSoxMDArXCIlXCJ9KX0pLFMmJihRLmxhc3RJbmRleD0wLGE9YS5yZXBsYWNlKFEsZnVuY3Rpb24oYSl7cmV0dXJuIFMrYX0pKSxhPWEucmVwbGFjZShOLGZ1bmN0aW9uKGEpe3JldHVybiBiLnB1c2goK2EpLFwiez99XCJ9KSxiLnVuc2hpZnQoYSksYn0sYmE9ZnVuY3Rpb24oYSl7dmFyIGIsYyxkPXt9O2ZvcihiPTAsYz1hLmtleUZyYW1lcy5sZW5ndGg7Yz5iO2IrKyljYShhLmtleUZyYW1lc1tiXSxkKTtmb3IoZD17fSxiPWEua2V5RnJhbWVzLmxlbmd0aC0xO2I+PTA7Yi0tKWNhKGEua2V5RnJhbWVzW2JdLGQpfSxjYT1mdW5jdGlvbihhLGIpe3ZhciBjO2ZvcihjIGluIGIpaC5jYWxsKGEucHJvcHMsYyl8fChhLnByb3BzW2NdPWJbY10pO2ZvcihjIGluIGEucHJvcHMpYltjXT1hLnByb3BzW2NdfSxkYT1mdW5jdGlvbihhLGIsYyl7dmFyIGQsZT1hLmxlbmd0aDtpZihlIT09Yi5sZW5ndGgpdGhyb3dcIkNhbid0IGludGVycG9sYXRlIGJldHdlZW4gXFxcIlwiK2FbMF0rJ1wiIGFuZCBcIicrYlswXSsnXCInO3ZhciBmPVthWzBdXTtmb3IoZD0xO2U+ZDtkKyspZltkXT1hW2RdKyhiW2RdLWFbZF0pKmM7cmV0dXJuIGZ9LGVhPWZ1bmN0aW9uKGEpe3ZhciBiPTE7cmV0dXJuIE8ubGFzdEluZGV4PTAsYVswXS5yZXBsYWNlKE8sZnVuY3Rpb24oKXtyZXR1cm4gYVtiKytdfSl9LGZhPWZ1bmN0aW9uKGEsYil7YT1bXS5jb25jYXQoYSk7Zm9yKHZhciBjLGQsZT0wLGY9YS5sZW5ndGg7Zj5lO2UrKylkPWFbZV0sYz1pYVtkW0ZdXSxjJiYoYj8oZC5zdHlsZS5jc3NUZXh0PWMuZGlydHlTdHlsZUF0dHIsRWEoZCxjLmRpcnR5Q2xhc3NBdHRyKSk6KGMuZGlydHlTdHlsZUF0dHI9ZC5zdHlsZS5jc3NUZXh0LGMuZGlydHlDbGFzc0F0dHI9RGEoZCksZC5zdHlsZS5jc3NUZXh0PWMuc3R5bGVBdHRyLEVhKGQsYy5jbGFzc0F0dHIpKSl9LGdhPWZ1bmN0aW9uKCl7dWE9XCJ0cmFuc2xhdGVaKDApXCIsZy5zZXRTdHlsZShqYSxcInRyYW5zZm9ybVwiLHVhKTt2YXIgYT1qKGphKSxiPWEuZ2V0UHJvcGVydHlWYWx1ZShcInRyYW5zZm9ybVwiKSxjPWEuZ2V0UHJvcGVydHlWYWx1ZShTK1widHJhbnNmb3JtXCIpLGQ9YiYmXCJub25lXCIhPT1ifHxjJiZcIm5vbmVcIiE9PWM7ZHx8KHVhPVwiXCIpfTtnLnNldFN0eWxlPWZ1bmN0aW9uKGEsYixjKXt2YXIgZD1hLnN0eWxlO2lmKGI9Yi5yZXBsYWNlKEwsTSkucmVwbGFjZShcIi1cIixcIlwiKSxcInpJbmRleFwiPT09Yilpc05hTihjKT9kW2JdPWM6ZFtiXT1cIlwiKygwfGMpO2Vsc2UgaWYoXCJmbG9hdFwiPT09YilkLnN0eWxlRmxvYXQ9ZC5jc3NGbG9hdD1jO2Vsc2UgdHJ5e1ImJihkW1IrYi5zbGljZSgwLDEpLnRvVXBwZXJDYXNlKCkrYi5zbGljZSgxKV09YyksZFtiXT1jfWNhdGNoKGUpe319O3ZhciBoYSxpYSxqYSxrYSxsYSxtYSxuYSxvYSxwYSxxYSxyYSxzYSx0YSx1YSx2YSx3YT1nLmFkZEV2ZW50PWZ1bmN0aW9uKGIsYyxkKXt2YXIgZT1mdW5jdGlvbihiKXtyZXR1cm4gYj1ifHxhLmV2ZW50LGIudGFyZ2V0fHwoYi50YXJnZXQ9Yi5zcmNFbGVtZW50KSxiLnByZXZlbnREZWZhdWx0fHwoYi5wcmV2ZW50RGVmYXVsdD1mdW5jdGlvbigpe2IucmV0dXJuVmFsdWU9ITEsYi5kZWZhdWx0UHJldmVudGVkPSEwfSksZC5jYWxsKHRoaXMsYil9O2M9Yy5zcGxpdChcIiBcIik7Zm9yKHZhciBmLGc9MCxoPWMubGVuZ3RoO2g+ZztnKyspZj1jW2ddLGIuYWRkRXZlbnRMaXN0ZW5lcj9iLmFkZEV2ZW50TGlzdGVuZXIoZixkLCExKTpiLmF0dGFjaEV2ZW50KFwib25cIitmLGUpLFVhLnB1c2goe2VsZW1lbnQ6YixuYW1lOmYsbGlzdGVuZXI6ZH0pfSx4YT1nLnJlbW92ZUV2ZW50PWZ1bmN0aW9uKGEsYixjKXtiPWIuc3BsaXQoXCIgXCIpO2Zvcih2YXIgZD0wLGU9Yi5sZW5ndGg7ZT5kO2QrKylhLnJlbW92ZUV2ZW50TGlzdGVuZXI/YS5yZW1vdmVFdmVudExpc3RlbmVyKGJbZF0sYywhMSk6YS5kZXRhY2hFdmVudChcIm9uXCIrYltkXSxjKX0seWE9ZnVuY3Rpb24oKXtmb3IodmFyIGEsYj0wLGM9VWEubGVuZ3RoO2M+YjtiKyspYT1VYVtiXSx4YShhLmVsZW1lbnQsYS5uYW1lLGEubGlzdGVuZXIpO1VhPVtdfSx6YT1mdW5jdGlvbihhLGIsYyl7a2Eua2V5ZnJhbWUmJmthLmtleWZyYW1lLmNhbGwoaGEsYSxiLGMpfSxBYT1mdW5jdGlvbigpe3ZhciBhPWhhLmdldFNjcm9sbFRvcCgpO0phPTAsbGEmJiFTYSYmKGYuc3R5bGUuaGVpZ2h0PVwiXCIpLFkoKSxsYSYmIVNhJiYoZi5zdHlsZS5oZWlnaHQ9SmErZS5jbGllbnRIZWlnaHQrXCJweFwiKSxTYT9oYS5zZXRTY3JvbGxUb3AoaS5taW4oaGEuZ2V0U2Nyb2xsVG9wKCksSmEpKTpoYS5zZXRTY3JvbGxUb3AoYSwhMCksc2E9ITB9LEJhPWZ1bmN0aW9uKCl7dmFyIGEsYixjPWUuY2xpZW50SGVpZ2h0LGQ9e307Zm9yKGEgaW4gbWEpYj1tYVthXSxcImZ1bmN0aW9uXCI9PXR5cGVvZiBiP2I9Yi5jYWxsKGhhKTovcCQvLnRlc3QoYikmJihiPWIuc2xpY2UoMCwtMSkvMTAwKmMpLGRbYV09YjtyZXR1cm4gZH0sQ2E9ZnVuY3Rpb24oKXt2YXIgYSxiPTA7cmV0dXJuIGphJiYoYj1pLm1heChqYS5vZmZzZXRIZWlnaHQsamEuc2Nyb2xsSGVpZ2h0KSksYT1pLm1heChiLGYuc2Nyb2xsSGVpZ2h0LGYub2Zmc2V0SGVpZ2h0LGUuc2Nyb2xsSGVpZ2h0LGUub2Zmc2V0SGVpZ2h0LGUuY2xpZW50SGVpZ2h0KSxhLWUuY2xpZW50SGVpZ2h0fSxEYT1mdW5jdGlvbihiKXt2YXIgYz1cImNsYXNzTmFtZVwiO3JldHVybiBhLlNWR0VsZW1lbnQmJmIgaW5zdGFuY2VvZiBhLlNWR0VsZW1lbnQmJihiPWJbY10sYz1cImJhc2VWYWxcIiksYltjXX0sRWE9ZnVuY3Rpb24oYixkLGUpe3ZhciBmPVwiY2xhc3NOYW1lXCI7aWYoYS5TVkdFbGVtZW50JiZiIGluc3RhbmNlb2YgYS5TVkdFbGVtZW50JiYoYj1iW2ZdLGY9XCJiYXNlVmFsXCIpLGU9PT1jKXJldHVybiB2b2lkKGJbZl09ZCk7Zm9yKHZhciBnPWJbZl0saD0wLGk9ZS5sZW5ndGg7aT5oO2grKylnPUdhKGcpLnJlcGxhY2UoR2EoZVtoXSksXCIgXCIpO2c9RmEoZyk7Zm9yKHZhciBqPTAsaz1kLmxlbmd0aDtrPmo7aisrKS0xPT09R2EoZykuaW5kZXhPZihHYShkW2pdKSkmJihnKz1cIiBcIitkW2pdKTtiW2ZdPUZhKGcpfSxGYT1mdW5jdGlvbihhKXtyZXR1cm4gYS5yZXBsYWNlKEgsXCJcIil9LEdhPWZ1bmN0aW9uKGEpe3JldHVyblwiIFwiK2ErXCIgXCJ9LEhhPURhdGUubm93fHxmdW5jdGlvbigpe3JldHVybituZXcgRGF0ZX0sSWE9ZnVuY3Rpb24oYSxiKXtyZXR1cm4gYS5mcmFtZS1iLmZyYW1lfSxKYT0wLEthPTEsTGE9XCJkb3duXCIsTWE9LTEsTmE9SGEoKSxPYT0wLFBhPTAsUWE9ITEsUmE9MCxTYT0hMSxUYT0wLFVhPVtdO1wiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZD9kZWZpbmUoW10sZnVuY3Rpb24oKXtyZXR1cm4gZ30pOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBtb2R1bGUmJm1vZHVsZS5leHBvcnRzP21vZHVsZS5leHBvcnRzPWc6YS5za3JvbGxyPWd9KHdpbmRvdyxkb2N1bWVudCk7IiwiZnVuY3Rpb24gaXNpUGhvbmUoKXtcbiAgcmV0dXJuIChcbiAgICAobmF2aWdhdG9yLnBsYXRmb3JtLmluZGV4T2YoXCJpUGhvbmVcIikgIT0gLTEpIHx8XG4gICAgKG5hdmlnYXRvci5wbGF0Zm9ybS5pbmRleE9mKFwiaVBvZFwiKSAhPSAtMSlcbiAgKTtcbn1cbmZ1bmN0aW9uIGlzaVBhZCgpe1xuICByZXR1cm4gKFxuICAgIChuYXZpZ2F0b3IucGxhdGZvcm0uaW5kZXhPZihcImlQYWRcIikgIT0gLTEpXG4gICk7XG59XG5pZihpc2lQaG9uZSgpKXtcbiAgJCgnYm9keScpLmFkZENsYXNzKCdpcGhvbmUnKTtcbn1cbmlmKGlzaVBhZCgpKXtcbiAgJCgnYm9keScpLmFkZENsYXNzKCdpcGFkJyk7XG59XG4iLCIvL0FjdGl2YXRlIFNrcm9sbHJcbmlmICgkKCdib2R5JykuaGFzQ2xhc3MoJ2hvbWUnKSkge1xuICB2YXIgcyA9IHNrcm9sbHIuaW5pdCgpO1xufVxuXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzID0gc2tyb2xsci5pbml0KCk7XG4gIGlmIChzLmlzTW9iaWxlKCkpIHtcbiAgICAgIHMuZGVzdHJveSgpO1xuICB9XG4gIGlmKGlzaVBhZCgpKXtcbiAgICBzLmRlc3Ryb3koKTsgLy8gc2tyb2xsci5pbml0KCkgcmV0dXJucyB0aGUgc2luZ2xldG9uIGNyZWF0ZWQgYWJvdmVcbiAgfVxuICB2YXIgY3VycmVudFNpemUgPSBGb3VuZGF0aW9uLk1lZGlhUXVlcnkuY3VycmVudDtcbiAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5jdXJyZW50ID09IFwic21hbGxcIikge1xuICAgIHMuZGVzdHJveSgpOyAvLyBza3JvbGxyLmluaXQoKSByZXR1cm5zIHRoZSBzaW5nbGV0b24gY3JlYXRlZCBhYm92ZVxuICB9XG59O1xuXG4kKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIGZ1bmN0aW9uKGV2ZW50LCBuZXdTaXplLCBvbGRTaXplKXtcbiAgaWYoaXNpUGFkKCkpe1xuICB9IGVsc2Uge1xuICAgIGlmIChGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdCgnbWVkaXVtJykpIHtcbiAgICAgICQoJy5wYXJhbGxheC1iZycpLmNzcyh7XCJvcGFjaXR5XCI6IFwiMVwifSk7XG4gICAgICAkKCcubWFpbi1jb250ZW50JykucmVtb3ZlQ2xhc3MoJ2FuaW1hdGUtaW4nKTtcbiAgICAgIHNrcm9sbHIuaW5pdCgpOyAvLyBza3JvbGxyLmluaXQoKSByZXR1cm5zIHRoZSBzaW5nbGV0b24gY3JlYXRlZCBhYm92ZVxuICAgIH0gZWxzZSB7XG4gICAgICBza3JvbGxyLmluaXQoKS5kZXN0cm95KCk7IC8vIHNrcm9sbHIuaW5pdCgpIHJldHVybnMgdGhlIHNpbmdsZXRvbiBjcmVhdGVkIGFib3ZlXG4gICAgICAkKCcucGFyYWxsYXgtYmcnKS5jc3Moe1wib3BhY2l0eVwiOiBcIjFcIn0pO1xuICAgIH1cbiAgfVxufSk7XG4iLCIvLyBDT05UQUNUXG52YXIgY29udGFjdCA9ICQoJyNjb250YWN0Rm9ybScpO1xuXG5mdW5jdGlvbiBnZXRWaXNpYmxlSGVpZ2h0KCl7XG4gIHZhciBzdWJ0cmFjdEhlaWdodCA9ICQoXCIjbmF2QmFyXCIpLmhlaWdodCgpICsgJChcIiN3cGFkbWluYmFyXCIpLmhlaWdodCgpO1xuICB2YXIgdkggPSAkKHdpbmRvdykuaGVpZ2h0KCkgLSBzdWJ0cmFjdEhlaWdodDtcbiAgcmV0dXJuIHZIO1xufVxuZnVuY3Rpb24gc2V0Q29udGFjdE1hcmdpbigpIHtcbiAgJCgnI2NvbnRhY3RGb3JtJykuY3NzKCdtYXJnaW5Ub3AnLCBnZXRWaXNpYmxlSGVpZ2h0KCkgKiAtMSk7XG59XG5cbmZ1bmN0aW9uIHNldENvbnRhY3RIZWlnaHQoKSB7XG5cdCQoJyNjb250YWN0Rm9ybScpLmhlaWdodChnZXRWaXNpYmxlSGVpZ2h0KCkpO1xufVxuXG4kKGZ1bmN0aW9uKCkge1xuICBzZXRDb250YWN0SGVpZ2h0KCk7XG4gIHNldENvbnRhY3RNYXJnaW4oKTtcbiAgJCggd2luZG93ICkucmVzaXplKGZ1bmN0aW9uKCkge1xuICAgIHNldENvbnRhY3RIZWlnaHQoKTtcbiAgICBzZXRDb250YWN0TWFyZ2luKCk7XG4gIH0pO1xufSk7XG5cbi8vIFNsaWRlVG9nZ2xlIENvbnRhY3QgRm9ybVxuJCgnYVtocmVmPSNjb250YWN0XScpLmNsaWNrKGZ1bmN0aW9uKCl7XG4gIHNldENvbnRhY3RIZWlnaHQoKTtcbiAgc2V0Q29udGFjdE1hcmdpbigpO1xuICAvLyBTZXQgYSBjbGFzcyBzbyB3ZSBjYW4gc2VlIHRlc3QgdGhlIHN0YXRlIG9mIHRoZSBmb3JtXG4gICQoJyNjb250YWN0Rm9ybScpLmNzcygnbWFyZ2luVG9wJywgMCk7XG4gICQoJ2JvZHknKS50b2dnbGVDbGFzcyhcImNvbnRhY3RcIik7XG4gICQoJy5vdmVybGF5JykudG9nZ2xlQ2xhc3MoJ3Zpc2libGUnKTtcblxuICAvLyBJZiBjbGlja2VkIHdoaWxlIGZvcm0gaXMgaGlkZGVuXG4gIGlmICgkKCdib2R5JykuaGFzQ2xhc3MoJ2NvbnRhY3QnKSkge1xuICAgICAvLyBTbGlkZWRvd24gZm9ybVxuICAgICAkKCcjY29udGFjdEZvcm0nKS5hZGRDbGFzcygnY29udGFjdC1yZXZlYWwnKTtcbiAgICAgJCgnI2Nsb3NlRm9ybScpLmFkZENsYXNzKCd2aXNpYmxlJyk7XG4gIH0gZWxzZSB7XG4gICAgc2V0Q29udGFjdE1hcmdpbigpO1xuICAgICQoJyNjbG9zZUZvcm0nKS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xuICAgICQoJyNjb250YWN0Rm9ybScpLnJlbW92ZUNsYXNzKCdjb250YWN0LXJldmVhbCcpO1xuICB9XG5cbiAgaWYgKCEkKCdib2R5JykuaGFzQ2xhc3MoJ21vYmlsZS1uYXYnKSkge1xuICAgICAkKCdib2R5JykudG9nZ2xlQ2xhc3MoXCJmaXhlZFwiKTtcbiAgfVxufSk7XG5cbi8vIENsb3NlIEZvcm0gQnV0dG9uXG4kKCcjY2xvc2VGb3JtJykuY2xpY2soZnVuY3Rpb24oKXtcbiAgc2V0Q29udGFjdE1hcmdpbigpO1xuICAkKCcjY2xvc2VGb3JtJykucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcbiAgJCgnLm92ZXJsYXknKS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xuICAkKCcjY29udGFjdEZvcm0nKS5yZW1vdmVDbGFzcygnY29udGFjdC1yZXZlYWwnKTtcbiAgJCgnYm9keScpLnJlbW92ZUNsYXNzKFwiY29udGFjdFwiKTtcblxuICBpZiAoISQoJ2JvZHknKS5oYXNDbGFzcygnbW9iaWxlLW5hdicpKSB7XG4gICAgJCgnYm9keScpLnJlbW92ZUNsYXNzKFwiZml4ZWRcIik7XG4gIH1cbn0pO1xuXG4kKHdpbmRvdykubG9hZChmdW5jdGlvbigpe1xuICAkKCcuaHMtaW5wdXQnKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgIHZhciBpbnB1dD0kKHRoaXMpO1xuICAgIHZhciBpc192YWxpZD1pbnB1dC52YWwoKTtcbiAgICAkKCdzZWxlY3QnKS5wYXJlbnQoKS5zaWJsaW5ncygnbGFiZWwnKS5hZGRDbGFzcyhcImZsb2F0XCIpO1xuICAgIGlmKGlzX3ZhbGlkKXtcbiAgICAgIGlucHV0LnJlbW92ZUNsYXNzKFwiaW52YWxpZFwiKS5hZGRDbGFzcyhcInZhbGlkXCIpO1xuICAgICAgaW5wdXQucGFyZW50KCkuc2libGluZ3MoJ2xhYmVsJykuYWRkQ2xhc3MoXCJmbG9hdFwiKTtcbiAgICB9IGVsc2V7XG4gICAgICBpbnB1dC5yZW1vdmVDbGFzcyhcInZhbGlkXCIpLmFkZENsYXNzKFwiaW52YWxpZFwiKTtcbiAgICAgIGlucHV0LnBhcmVudCgpLnNpYmxpbmdzKCdsYWJlbCcpLnJlbW92ZUNsYXNzKFwiZmxvYXRcIik7XG4gICAgfVxuICB9KTtcbiAgJCgnLmhzLWlucHV0Jykub24oJ2lucHV0JywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlucHV0PSQodGhpcyk7XG4gICAgdmFyIGlzX3ZhbGlkPWlucHV0LnZhbCgpO1xuICAgIGlmKGlzX3ZhbGlkKXtcbiAgICAgIGlucHV0LnJlbW92ZUNsYXNzKFwiaW52YWxpZFwiKS5hZGRDbGFzcyhcInZhbGlkXCIpO1xuICAgICAgaW5wdXQucGFyZW50KCkuc2libGluZ3MoJ2xhYmVsJykuYWRkQ2xhc3MoXCJmbG9hdFwiKTtcbiAgICB9IGVsc2V7XG4gICAgICBpbnB1dC5yZW1vdmVDbGFzcyhcInZhbGlkXCIpLmFkZENsYXNzKFwiaW52YWxpZFwiKTtcbiAgICAgIGlucHV0LnBhcmVudCgpLnNpYmxpbmdzKCdsYWJlbCcpLnJlbW92ZUNsYXNzKFwiZmxvYXRcIik7XG4gICAgfVxuICB9KTtcbn0pO1xuIiwialF1ZXJ5KCAnaWZyYW1lW3NyYyo9XCJ5b3V0dWJlLmNvbVwiXScpLndyYXAoXCI8ZGl2IGNsYXNzPSdmbGV4LXZpZGVvIHdpZGVzY3JlZW4nLz5cIik7XG5qUXVlcnkoICdpZnJhbWVbc3JjKj1cInZpbWVvLmNvbVwiXScpLndyYXAoXCI8ZGl2IGNsYXNzPSdmbGV4LXZpZGVvIHdpZGVzY3JlZW4gdmltZW8nLz5cIik7XG4iLCIkKGZ1bmN0aW9uKCkge1xuICBpZiAoRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QoJ21lZGl1bScpKSB7XG4gICAgaWYoaXNpUGFkKCkpe1xuICAgICAgJCgnLmhlYWRsaW5lJykuYWRkQ2xhc3MoJ3JlbGF0aXZlJyk7XG4gICAgICAkKCcuaGVhZGxpbmUnKS5wYXJlbnQoKS5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiMCFpbXBvcnRhbnRcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgICQoJy5oZWFkbGluZScpLnBhcmVudCgpLmNzcyhcInBhZGRpbmctdG9wXCIsXCIxNDBweFwiKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgJCgnLmhlYWRsaW5lJykucGFyZW50KCkuY3NzKFwicGFkZGluZy10b3BcIixcIjBcIik7XG4gIH1cbn0pO1xuXG5pZighaXNpUGFkKCkpe1xuICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIGZ1bmN0aW9uKGV2ZW50LCBuZXdTaXplLCBvbGRTaXplKXtcbiAgICBpZiAoRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QoJ21lZGl1bScpKSB7XG4gICAgICAkKCcuaGVhZGxpbmUnKS5wYXJlbnQoKS5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiMTQwcHhcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgICQoJy5oZWFkbGluZScpLnBhcmVudCgpLmNzcyhcInBhZGRpbmctdG9wXCIsXCIwXCIpO1xuICAgIH1cbiAgfSk7XG59XG4iLCJqUXVlcnkoZG9jdW1lbnQpLmZvdW5kYXRpb24oKTtcbiIsIi8vIEpveXJpZGUgZGVtb1xuJCgnI3N0YXJ0LWpyJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICQoZG9jdW1lbnQpLmZvdW5kYXRpb24oJ2pveXJpZGUnLCdzdGFydCcpO1xufSk7IiwiLy8gU2VxdWVudGlhbCBuYXYgY29sb3IgZmFkZSBpblxuJCgnLmRlc2t0b3AtbWVudSBsaScpLmVhY2goZnVuY3Rpb24oaW5kZXgsIGVsZW1lbnQpIHtcbiAgJChlbGVtZW50KS5kZWxheShpbmRleCozMDApLnF1ZXVlKGZ1bmN0aW9uKCl7XG4gICAgJCh0aGlzKS5hZGRDbGFzcygnY29sb3JpemUnKTtcbiAgfSk7XG59KTtcblxuLy8gd2FpdCBmb3IgaW1hZ2VzXG52YXIgaGVybyA9ICQoXCIjZmVhdHVyZWQtaGVyb1wiKTtcbmlmKGhlcm8ubGVuZ3RoKSB7XG4gICQoXCIjZmVhdHVyZWQtaGVyb1wiKS53YWl0Rm9ySW1hZ2VzKGZ1bmN0aW9uKCkge1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICQoXCIjZmVhdHVyZWQtaGVyb1wiKS5hZGRDbGFzcyhcImFuaW1hdGUtaW5cIik7XG4gICAgICAkKCcub3ZlcmxheScpLnJlbW92ZUNsYXNzKCdsb2FkJyk7XG4gICAgfSwgNTAwKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAkKCcubWFpbi1jb250ZW50JykuYWRkQ2xhc3MoJ2FuaW1hdGUtaW4nKS5jc3Moe1widHJhbnNmb3JtXCI6XCJ0cmFuc2xhdGUoMHB4LDBweClcIn0pO1xuICAgICAgJCgnLnByZXNlbnQnKS5hZGRDbGFzcygnYW5pbWF0ZS1pbicpLmNzcyh7XCJ0cmFuc2Zvcm1cIjpcInRyYW5zbGF0ZSgwcHgsMHB4KVwifSk7XG4gICAgICAkKCcucGFyYWxsYXgtYmcnKS5hZGRDbGFzcygnYW5pbWF0ZS1pbicpLmNzcyh7XCJvcGFjaXR5XCI6IFwiMVwifSk7XG4gICAgfSwgMTAwMCk7XG4gIH0pO1xufSBlbHNlIHtcbiAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICQoXCIjZmVhdHVyZWQtaGVyb1wiKS5hZGRDbGFzcyhcImFuaW1hdGUtaW5cIik7XG4gICAgJCgnLm92ZXJsYXknKS5yZW1vdmVDbGFzcygnbG9hZCcpO1xuICAgICQoJy5tYWluLWNvbnRlbnQnKS5hZGRDbGFzcygnYW5pbWF0ZS1pbicpLmNzcyh7XCJ0cmFuc2Zvcm1cIjpcInRyYW5zbGF0ZSgwcHgsMHB4KVwifSk7XG4gICAgJCgnLnByZXNlbnQnKS5hZGRDbGFzcygnYW5pbWF0ZS1pbicpLmNzcyh7XCJ0cmFuc2Zvcm1cIjpcInRyYW5zbGF0ZSgwcHgsMHB4KVwifSk7XG4gICAgJCgnLnBhcmFsbGF4LWJnJykuYWRkQ2xhc3MoJ2FuaW1hdGUtaW4nKS5jc3Moe1wib3BhY2l0eVwiOiBcIjFcIn0pO1xuICB9LCAzMDApO1xufVxuXG4vLyBMb2dvIGZhZGUgaW5cbnNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgJCgnLmhvbWUtbGluaycpLmFkZENsYXNzKCdjb2xvcml6ZScpO1xufSwgMzAwKTtcblxuc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAkKCcubWFpbi1jb250ZW50JykucmVtb3ZlQ2xhc3MoJ2FuaW1hdGUtaW4nKTtcbiAgJCgnLnBhcmFsbGF4LWJnJykucmVtb3ZlQ2xhc3MoJ2FuaW1hdGUtaW4nKTtcbn0sIDMwMDApO1xuXG4vLyBQcmVzZW50XG4iLCIvLyBTb21lIGpxdWVyeSB0byBhZGQgc29tZSBzdHlsaW5nIHRvIHRoZSBtYXJrZG93biBwYXJzZWQgaHRtbCBvbiBzaG93Y2FzZSBwYWdlc1xuXG4vLyBGaW5kIGltZ3MgaW4gYSBwYXJhZ3JhcGggdGFnIGFuZCB3cmFwIHRoZW0gaW4gYSByb3dcbiQoIFwiI2NvbnRlbnRCb2R5IHBcIiApLmhhcyggXCJpbWdcIiApLndyYXAoICc8ZGl2IGNsYXNzPVwicm93IGV4cGFuZGVkIGNvbGxhcHNlIGZsZXgtd3JhcFwiIC8+Jyk7XG4kKCBcIi5mbGV4LXdyYXAgcFwiICkuaGFzKCBcImltZ1wiICkuY29udGVudHMoKS51bndyYXAoKTtcblxuLy8gRmluZCB2aWRlb3Mgd2Ugd2FudCB0byBwdXQgaW50byBhIGNvbHVtblxuLy8gaWZyYW1lcyBhcmUgcGxhY2VkIGluIHAgdGFncywgc28gbGV0J3MgbG9vayB0aGVyZVxuJCggXCIjY29udGVudEJvZHkgcFwiICkuaGFzKFwiaWZyYW1lXCIpLmVhY2goZnVuY3Rpb24oKSB7XG4gIC8vIEZvciBlYWNoIHAgd2l0aCBhIHZpZGVvIHdlIGZpbmQgd2UgbmVlZCB0byB3cmFwIGl0IHdpdGggYSAudmlkZW8tY29sdW1uXG4gICQodGhpcykud3JhcChcIjxkaXYgY2xhc3M9J2NvbHVtbnMgdmlkZW8tY29sdW1uJyAvPlwiKTtcbiAgLy8gTm93IHdlIG5lZWQgdG8gdW53cmFwIHRoZSBwXG4gICQoXCIudmlkZW8tY29sdW1uIHBcIikuZWFjaChmdW5jdGlvbigpIHtcbiAgICAkKHRoaXMpLmhhcyggXCJpZnJhbWVcIiApLmNvbnRlbnRzKCkudW53cmFwKCk7XG4gIH0pO1xuICAvLyBJZiB0aGUgcHJldmlvdXMgZWxlbWVudCBpcyBhbiBoNiB3ZSBwcmVwZW5kIGl0IHRvIGxvb2sgbGlrZSBhIGNhcHRpb25cbiAgJChcIi52aWRlby1jb2x1bW5cIikuZWFjaChmdW5jdGlvbigpIHtcbiAgICAkKHRoaXMpLnByZXYoJ2g2JykucHJlcGVuZFRvKCQodGhpcykpO1xuICB9KTtcbn0pO1xuXG4vLyBMZXQncyB3cmFwIHdpc3RpYSBkaXZzXG4vLyBUaGV5IGFyZW4ndCBpbiBQIHRhZ3MsIHNvIGl0J3MgYSBiaXQgZWFzaWVyLlxuJChcIi53aXN0aWFfcmVzcG9uc2l2ZV9wYWRkaW5nXCIpLndyYXAoXCI8ZGl2IGNsYXNzPSdjb2x1bW5zIHZpZGVvLWNvbHVtbicgLz5cIik7XG5cbi8vIE5vdyB3ZSB3cmFwIGl0IHdpdGggYSBuZXcgc2VsZWN0b3IsIHRoaXMgaGVscHMgdXMgc2hpZnQgdGhpbmdzIGFyb3VuZFxuJCgnLnZpZGVvLWNvbHVtbicpLndyYXAoXCI8ZGl2IGNsYXNzPSd2aWRlby1zZWxlY3RvcicgLz5cIik7XG5cbi8vIEZvciBlYWNoIC52aWRlby1zZWxlY3RvciB3ZSdyZSBnb2luZyB0byBnbyBuZXh0IHVudGlsIHRoZSBuZXh0IGVsZW1lbnQgaXMgbm90IGEgdmlkZW8tc2VsZWN0b3Jcbi8vIFNvIHdlIGJhc2ljYWxseSBncmFiIGFsbCB0aGUgaW1tZWRpYXRlIHZpZGVvIHNpYmxpbmdzXG4kKCcudmlkZW8tc2VsZWN0b3InKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAkKHRoaXMpLm5leHRVbnRpbChcIjpub3QoLnZpZGVvLXNlbGVjdG9yKVwiKS5hcHBlbmRUbygkKHRoaXMpKS5jb250ZW50cygpLnVud3JhcCgpO1xufSk7XG4vLyBXZSB3cmFwIGFsbCB0aGUgc2libGluZ3MgaW4gb25lIHJvd1xuJCggXCIudmlkZW8tc2VsZWN0b3JcIiApLndyYXAoICc8ZGl2IGNsYXNzPVwicm93IGV4cGFuZGVkIGNvbGxhcHNlIGZsZXgtd3JhcFwiIC8+Jyk7XG4vLyBBbmQgdGhlbiBkaXRjaCB0aGUgLnZpZGVvLXNlbGVjdG9yIGVsZW1lbnRcbiQoIFwiLnZpZGVvLXNlbGVjdG9yXCIgKS5oYXMoIFwiLnZpZGVvLWNvbHVtblwiICkuY29udGVudHMoKS51bndyYXAoKTtcblxudmFyIHJvd1dyYXAgPSAnPGRpdiBjbGFzcz1cInJvdyBhbGlnbi1jZW50ZXIgY29udGVudFwiPjxkaXYgY2xhc3M9XCJzbWFsbC0xMiBjb2x1bW5zIGNvbnRlbnQtY29sXCI+PC9kaXY+PC9kaXY+JztcbnZhciBmaXJzdENoaWxkID0gJCgnI2NvbnRlbnRCb2R5JykuY2hpbGRyZW4oKS5maXJzdCgpO1xuXG5maXJzdENoaWxkLm5vdChcIi5mbGV4LXdyYXBcIikubmV4dFVudGlsKCcuZmxleC13cmFwJykuYW5kU2VsZigpLndyYXBBbGwocm93V3JhcCk7XG5cbiQoXCIuZmxleC13cmFwXCIpLmVhY2goZnVuY3Rpb24oaSkge1xuICAkKHRoaXMpLm5leHRVbnRpbCgnLmZsZXgtd3JhcCcpLndyYXBBbGwocm93V3JhcCk7XG4gIC8vIGlmIGltZyBpcyBpbiBhbiBhbmNob3IgdGFnIHdyYXAgdGhlIGFuY2hvciB0YWcgaW4gY29sdW1uXG4gICQodGhpcykuaGFzKCBcImFcIiApLmZpbmQoXCJhXCIpLndyYXAoIFwiPGRpdiBjbGFzcz0nY29sdW1ucyc+PC9kaXY+XCIgKTtcbiAgLy8gaWYgaW1nIGlzIGluIGZsZXgtd3JhcCB3cmFwIGluIGNvbHVtblxuICAkKHRoaXMpLmhhcyggXCJpbWdcIiApLmZpbmQoXCJpbWdcIikud3JhcCggXCI8ZGl2IGNsYXNzPSdjb2x1bW5zJz48L2Rpdj5cIiApO1xuXG4gIC8vIENsZWFuaW5nIHVwIHNvbWUgcG9zc2liaWxpdGllc1xuICAkKHRoaXMpLmhhcyggXCJhXCIgKS5maW5kKFwiYSAuY29sdW1uc1wiKS5jb250ZW50cygpLnVud3JhcCgpO1xuICAkKHRoaXMpLmhhcyggXCJiclwiICkuZmluZChcImJyXCIpLnJlbW92ZSgpO1xufSk7XG5cbi8vIElNRyBDYXB0aW9uc1xuJChcIi5jb2x1bW5zIGltZ1wiKS5lYWNoKGZ1bmN0aW9uKCkge1xuICB2YXIgaW1hZ2VDYXB0aW9uID0gJCh0aGlzKS5hdHRyKFwiYWx0XCIpO1xuICBpZiAoaW1hZ2VDYXB0aW9uKSB7XG4gICAgJChcIjxoNj5cIiArIGltYWdlQ2FwdGlvbiArIFwiPC9oNj5cIikuaW5zZXJ0QmVmb3JlKHRoaXMpO1xuICB9XG59KTtcblxuLy8gR0lGIGxvYWRpbmdcbiQoZnVuY3Rpb24oKSB7XG4gIC8vICQoJ2ltZ1tzcmMkPVwiLmdpZlwiXScpLmVhY2goZnVuY3Rpb24oKSB7XG4gIC8vICAgdmFyIHNyYyA9ICQodGhpcykuYXR0cihcInNyY1wiKTtcbiAgLy8gICAkKHRoaXMpLmF0dHIoXCJzcmNcIiwgc3JjLnJlcGxhY2UoL1xcLmdpZiQvaSwgXCIuanBnXCIpKTtcbiAgLy8gICAkKHRoaXMpLmFkZENsYXNzKFwiZ2lmXCIpO1xuICAvLyB9KTtcbiAgJCgnLmdpZicpLmhvdmVyKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNyYyA9ICQodGhpcykuYXR0cihcInNyY1wiKTtcbiAgICAgICQodGhpcykuYXR0cihcInNyY1wiLCBzcmMucmVwbGFjZSgvXFwuanBnJC9pLCBcIi5naWZcIikpO1xuICAgIH0sXG4gICAgZnVuY3Rpb24oKVxuICAgIHtcbiAgICAgIHZhciBzcmMgPSAkKHRoaXMpLmF0dHIoXCJzcmNcIik7XG4gICAgICAkKHRoaXMpLmF0dHIoXCJzcmNcIiwgc3JjLnJlcGxhY2UoL1xcLmdpZiQvaSwgXCIuanBnXCIpKTtcbiAgICB9KTtcbn0pO1xuIiwiJCgnI21vYmlsZU1lbnUnKS5oaWRlKCk7XG5mdW5jdGlvbiBnZXRWaXNpYmxlSGVpZ2h0TmF2KCl7XG4gIHZhciBzdWJ0cmFjdEhlaWdodCA9ICQoXCIjbmF2QmFyXCIpLmhlaWdodCgpICsgJChcIiN3cGFkbWluYmFyXCIpLmhlaWdodCgpICsgJChcIiNtb2JpbGVCb3hCdXR0b25cIikuaGVpZ2h0KCk7XG4gIHZhciB2SCA9ICQod2luZG93KS5oZWlnaHQoKSAtIHN1YnRyYWN0SGVpZ2h0O1xuICByZXR1cm4gdkg7XG59XG5cbmZ1bmN0aW9uIHNldE1vYmlsZU5hdkhlaWdodCgpIHtcblx0JCgnI21vYmlsZU1lbnUnKS5oZWlnaHQoZ2V0VmlzaWJsZUhlaWdodE5hdigpKTtcbn1cblxuJChmdW5jdGlvbigpIHtcblx0c2V0TW9iaWxlTmF2SGVpZ2h0KCk7XG5cdCQoIHdpbmRvdyApLnJlc2l6ZShmdW5jdGlvbigpIHtcblx0XHRzZXRNb2JpbGVOYXZIZWlnaHQoKTtcblx0fSk7XG59KTtcblxuXG4vLyBTbGlkZVRvZ2dsZSBNb2JpbGUgTmF2IEZvcm1cbiQoJyNtb2JpbGVUb2dnbGUnKS5jbGljayhmdW5jdGlvbigpe1xuXHQkKHRoaXMpLnRvZ2dsZUNsYXNzKCdvcGVuJyk7XG4gICQoJyNtb2JpbGVNZW51Jykuc2xpZGVUb2dnbGUoIFwic2xvd1wiLCBmdW5jdGlvbigpIHt9KTtcbiAgJCgnYm9keScpLnRvZ2dsZUNsYXNzKFwiZml4ZWQgbW9iaWxlLW5hdlwiKTtcbiAgJCgnI21vYmlsZU1lbnUgbGknKS5lYWNoKGZ1bmN0aW9uKGluZGV4LCBlbGVtZW50KSB7XG4gICAgICAkKGVsZW1lbnQpLmRlbGF5KGluZGV4KjE1MCkucXVldWUoZnVuY3Rpb24oKXtcbiAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnZmFkZS1pbicpO1xuICAgICAgfSk7XG4gIH0pO1xuXHRpZiAoJCgnYm9keScpLmhhc0NsYXNzKCdjb250YWN0JykpIHtcblx0XHRzZXRDb250YWN0TWFyZ2luKCk7XG5cdFx0JCgnI2Nsb3NlRm9ybScpLnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XG4gICAgJCgnI2NvbnRhY3RGb3JtJykucmVtb3ZlQ2xhc3MoJ2NvbnRhY3QtcmV2ZWFsJyk7XG5cdFx0JCgnLm92ZXJsYXknKS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xuXHRcdCQoJ2JvZHknKS5yZW1vdmVDbGFzcygnY29udGFjdCcpO1xuICB9XG59KTtcblxuJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBmdW5jdGlvbihldmVudCwgbmV3U2l6ZSwgb2xkU2l6ZSl7XG4gIGlmKG5ld1NpemUgPT0gIFwibWVkaXVtXCIpIHtcbiAgICBpZihvbGRTaXplID09IFwic21hbGxcIikge1xuICAgICAgJCgnI21vYmlsZU1lbnUnKS5zbGlkZVVwKCk7XG4gICAgICBpZiAoJCgnYm9keScpLmhhc0NsYXNzKFwibW9iaWxlLW5hdlwiKSkge1xuICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKFwiZml4ZWQgbW9iaWxlLW5hdlwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuXHRpZihvbGRTaXplID09ICBcIm1lZGl1bVwiKSB7XG4gICAgaWYobmV3U2l6ZSA9PSBcInNtYWxsXCIpIHtcbiAgICAgICQoJy5zdGlja3ktY29udGFpbmVyJykuY3NzKCdoZWlnaHQnLCAnYXV0bycpO1xuICAgIH1cbiAgfVxufSk7XG4iLCIvLyBNb2JpbGUgTmF2XG52YXIgbGFzdFNjcm9sbFRvcCA9IDA7XG4kKHdpbmRvdykuc2Nyb2xsKGZ1bmN0aW9uKGV2ZW50KXtcbiAgIHZhciBzdCA9ICQodGhpcykuc2Nyb2xsVG9wKCk7XG5cbiAgIGlmIChzdCA+IGxhc3RTY3JvbGxUb3Ape1xuICAgICBpZihzdCA+IDE1MCkge1xuICAgICAgJChcIiNuYXZpZ2F0aW9uQ29udGFpbmVyXCIpLmFkZENsYXNzKCdwZWVrLWhpZGUnKTtcbiAgICAgfVxuICAgfSBlbHNlIHtcbiAgICAgdmFyIG9mZnNldCA9IGxhc3RTY3JvbGxUb3AgLSBzdDtcbiAgICAgaWYgKG9mZnNldCA+IDIpIHtcbiAgICAgICBjb25zb2xlLmxvZyhvZmZzZXQpO1xuICAgICAgICQoXCIjbmF2aWdhdGlvbkNvbnRhaW5lclwiKS5yZW1vdmVDbGFzcygncGVlay1oaWRlJyk7XG4gICAgICAgJChcIiNuYXZpZ2F0aW9uQ29udGFpbmVyXCIpLmFkZENsYXNzKCdwZWVrJyk7XG4gICAgIH1cbiAgIH1cbiAgIGxhc3RTY3JvbGxUb3AgPSBzdDtcbn0pO1xuIiwiJCgnLmhvdmVyLWluZGljYXRvcicpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgdmFyIHdpZHRoID0gJCh0aGlzKS5uZXh0KCkuY2hpbGRyZW4oXCJoM1wiKS53aWR0aCgpO1xuICAgICQodGhpcykud2lkdGgod2lkdGggKyA0MCk7XG59KTtcbiQoIHdpbmRvdyApLnJlc2l6ZShmdW5jdGlvbigpIHtcbiAgJCgnLmhvdmVyLWluZGljYXRvcicpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgd2lkdGggPSAkKHRoaXMpLm5leHQoKS5jaGlsZHJlbihcImgzXCIpLndpZHRoKCk7XG4gICAgICAkKHRoaXMpLndpZHRoKHdpZHRoICsgNDApO1xuICB9KTtcbn0pO1xuJChcIi5wZXJtYWxpbmtcIikuaG92ZXIoZnVuY3Rpb24oKXtcbiAgICAkKHRoaXMpLmZpbmQoJy5ob3Zlci1pbmRpY2F0b3InKS50b2dnbGVDbGFzcyhcImhvdmVyXCIpO1xufSk7XG4iLCJcbiQod2luZG93KS5iaW5kKCcgbG9hZCByZXNpemUgb3JpZW50YXRpb25DaGFuZ2UgJywgZnVuY3Rpb24gKCkge1xuICAgdmFyIGZvb3RlciA9ICQoXCIjZm9vdGVyLWNvbnRhaW5lclwiKTtcbiAgIHZhciBwb3MgPSBmb290ZXIucG9zaXRpb24oKTtcbiAgIHZhciBoZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCk7XG4gICBoZWlnaHQgPSBoZWlnaHQgLSBwb3MudG9wO1xuICAgaGVpZ2h0ID0gaGVpZ2h0IC0gZm9vdGVyLmhlaWdodCgpIC0xO1xuXG4gICBmdW5jdGlvbiBzdGlja3lGb290ZXIoKSB7XG4gICAgIGZvb3Rlci5jc3Moe1xuICAgICAgICAgJ21hcmdpbi10b3AnOiBoZWlnaHQgKyAncHgnXG4gICAgIH0pO1xuICAgfVxuXG4gICBpZiAoaGVpZ2h0ID4gMCkge1xuICAgICBzdGlja3lGb290ZXIoKTtcbiAgIH1cbn0pO1xuIiwiJChcIiNmZWF0dXJlVmlkZW9cIikuZmFkZU91dCgpO1xuXG4vLyBQbGF5YmFjayBmb3IgQXJjaGl2ZSBQYWdlXG5mdW5jdGlvbiBhcmNoaXZlUGxheShwZXJtYSkge1xuICAkKFwiYm9keVwiKS5hZGRDbGFzcyhcInZpZGVvLWZpeGVkXCIpO1xuICAkKFwiI2ZlYXR1cmVkLWhlcm9cIikuYWRkQ2xhc3MoJ3ZpZGVvLXJldmVhbCcpLnJlbW92ZUNsYXNzKCdoaWRkZW4nKTtcbiAgJChcIiNmZWF0dXJlZC1oZXJvXCIpLmFkZENsYXNzKFwiY2xpY2stdG8tY2xvc2VcIik7XG4gICQoXCIuZmVhdHVyZS1vdmVybGF5XCIpLmFkZENsYXNzKFwiYW5pbWF0ZS1pblwiKTtcbiAgJCgnI25hdkJhcicpLmFkZENsYXNzKCdwdXNoLXVwJyk7XG4gICQoJy5tYWluLWNvbnRlbnQnKS5hZGRDbGFzcygncHVzaC1kb3duJyk7XG4gICQoJy5mZWF0dXJlLXBsYXknKS5mYWRlT3V0KCk7XG5cbiAgJCgnI3NlZVByb2plY3QnKS5hdHRyKFwiaHJlZlwiLCBwZXJtYSk7XG5cbiAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICQoXCIjZmVhdHVyZVZpZGVvXCIpLmZhZGVJbignc2xvdycpO1xuICB9LCA1MDApO1xuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuJChcIi5wbGF5XCIpLmNsaWNrKGZ1bmN0aW9uKCl7XG5cbiAgaWYoJCh0aGlzKS5oYXNDbGFzcygncmVlbCcpKSB7XG4gICAgJCgnI3NlZVByb2plY3QnKS5wYXJlbnQoKS5oaWRlKCk7XG4gIH0gZWxzZSB7XG4gICAgJCgnI3NlZVByb2plY3QnKS5wYXJlbnQoKS5zaG93KCk7XG4gIH1cbiAgdmFyIHBlcm1hbGluayA9ICQodGhpcykuYXR0cihcImRhdGEtcGVybWFsaW5rXCIpO1xuICBhcmNoaXZlUGxheShwZXJtYWxpbmspO1xufSk7XG5cblxuaWYoaXNpUGFkKCkgfHwgaXNpUGhvbmUoKSl7XG4gICQoJyNmZWF0dXJlZC1oZXJvJykuYWRkQ2xhc3MoJ2RldmljZScpO1xuXG4gICQoXCIuaXBsYXlcIikuYmluZChcInRvdWNoc3RhcnQgY2xpY2tcIiwgZnVuY3Rpb24oKXtcbiAgICB2YXIgcGVybWFsaW5rID0gJCh0aGlzKS5jbG9zZXN0KCdhJykuYXR0cihcImRhdGEtcGVybWFsaW5rXCIpO1xuICAgIGFyY2hpdmVQbGF5KHBlcm1hbGluayk7XG4gIH0pO1xufVxuXG4vL1BsYXliYWNrIGZvciBTaW5nbGUgUGFnZVxuJChcIi5mZWF0dXJlLXBsYXlcIikuY2xpY2soZnVuY3Rpb24oKXtcblxuICAkKFwiYm9keVwiKS5hZGRDbGFzcyhcInZpZGVvLWZpeGVkIHZpZGVvLXNpbmdsZVwiKTtcbiAgJChcIiNmZWF0dXJlZC1oZXJvXCIpLmFkZENsYXNzKFwidmlkZW8tcmV2ZWFsIGNsaWNrLXRvLWNsb3NlXCIpO1xuICAkKFwiLmZlYXR1cmUtb3ZlcmxheVwiKS5hZGRDbGFzcyhcImFuaW1hdGUtaW5cIik7XG4gICQoXCIjZmVhdHVyZVZpZGVvXCIpLmZhZGVJbignc2xvdycpO1xuICAkKCcjbmF2QmFyJykuYWRkQ2xhc3MoJ3B1c2gtdXAnKTtcbiAgJCgnLmZlYXR1cmUtcGxheScpLmFkZENsYXNzKCdibG93LXVwJyk7XG4gICQoJy5tYWluLWNvbnRlbnQnKS5hZGRDbGFzcygncHVzaC1kb3duJyk7XG5cbn0pO1xuXG4kKGRvY3VtZW50KS5tb3VzZXVwKGZ1bmN0aW9uIChlKSB7XG4gIHZhciBjb250YWluZXIgPSAkKFwiLndpc3RpYV9lbWJlZFwiKTtcblxuICBpZiAoJCgnYm9keScpLmhhc0NsYXNzKCd2aWRlby1maXhlZCcpKSB7XG4gICAgaWYgKCFjb250YWluZXIuaXMoZS50YXJnZXQpICYmIGNvbnRhaW5lci5oYXMoZS50YXJnZXQpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgJChcImJvZHlcIikucmVtb3ZlQ2xhc3MoXCJ2aWRlby1maXhlZFwiKTtcbiAgICAgICQoXCIjZmVhdHVyZVZpZGVvXCIpLmhpZGUoKTtcblxuICAgICAgaWYgKCQoJ2JvZHknKS5oYXNDbGFzcygndmlkZW8tc2luZ2xlJykpIHtcbiAgICAgICAgJChcIiNmZWF0dXJlZC1oZXJvXCIpLnJlbW92ZUNsYXNzKFwidmlkZW8tcmV2ZWFsIGNsaWNrLXRvLWNsb3NlXCIpO1xuICAgICAgICAkKFwiLmZlYXR1cmUtb3ZlcmxheVwiKS5yZW1vdmVDbGFzcyhcImFuaW1hdGUtaW5cIik7XG4gICAgICAgICQoJyNuYXZCYXInKS5yZW1vdmVDbGFzcygncHVzaC11cCcpO1xuICAgICAgICAkKCcuZmVhdHVyZS1wbGF5JykucmVtb3ZlQ2xhc3MoJ2Jsb3ctdXAnKTtcbiAgICAgICAgJCgnLm1haW4tY29udGVudCcpLnJlbW92ZUNsYXNzKCdwdXNoLWRvd24nKTtcbiAgICAgIH0gZWxzZSBpZigkKCdib2R5JykuaGFzQ2xhc3MoJ3NpbmdsZS1leGFtcGxlJykpIHtcbiAgICAgICAgJChcIiNmZWF0dXJlZC1oZXJvXCIpLnJlbW92ZUNsYXNzKFwidmlkZW8tcmV2ZWFsIGNsaWNrLXRvLWNsb3NlXCIpO1xuICAgICAgICAkKFwiLmZlYXR1cmUtb3ZlcmxheVwiKS5yZW1vdmVDbGFzcyhcImFuaW1hdGUtaW5cIik7XG4gICAgICAgICQoJyNuYXZCYXInKS5yZW1vdmVDbGFzcygncHVzaC11cCcpO1xuICAgICAgICAkKCcuZmVhdHVyZS1wbGF5JykucmVtb3ZlQ2xhc3MoJ2Jsb3ctdXAnKTtcbiAgICAgICAgJCgnLm1haW4tY29udGVudCcpLnJlbW92ZUNsYXNzKCdwdXNoLWRvd24nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICQoXCIjZmVhdHVyZWQtaGVyb1wiKS5yZW1vdmVDbGFzcygndmlkZW8tcmV2ZWFsJykuYWRkQ2xhc3MoJ2hpZGRlbicpO1xuICAgICAgICAkKFwiLmZlYXR1cmUtb3ZlcmxheVwiKS5yZW1vdmVDbGFzcyhcImFuaW1hdGUtaW5cIik7XG4gICAgICAgICQoJyNuYXZCYXInKS5yZW1vdmVDbGFzcygncHVzaC11cCcpO1xuICAgICAgICAkKCcubWFpbi1jb250ZW50JykucmVtb3ZlQ2xhc3MoJ3B1c2gtZG93bicpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufSk7XG5cbiQoXCIucGVybWFsaW5rXCIpLmhvdmVyKGZ1bmN0aW9uKCl7XG4gICQodGhpcykuc2libGluZ3MoXCIucG9zdC1ibG9ja1wiKS5maW5kKFwiLnBlcm1hbGluay1vdmVybGF5XCIpLnRvZ2dsZUNsYXNzKFwic2hvd1wiKTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
