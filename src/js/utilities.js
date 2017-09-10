// RegExps
const REGEXP_DATA_URL_HEAD = /^data:.*,/;
const REGEXP_HYPHENATE = /([a-z\d])([A-Z])/g;
const REGEXP_ORIGINS = /^(https?:)\/\/([^:/?#]+):?(\d*)/i;
const REGEXP_SPACES = /\s+/;
const REGEXP_SUFFIX = /^(width|height|left|top|marginLeft|marginTop)$/;
const REGEXP_TRIM = /^\s+(.*)\s+$/;
const REGEXP_USERAGENT = /(Macintosh|iPhone|iPod|iPad).*AppleWebKit/i;

// Utilities
const navigator = typeof window !== 'undefined' ? window.navigator : null;
const IS_SAFARI_OR_UIWEBVIEW = navigator && REGEXP_USERAGENT.test(navigator.userAgent);
const objectProto = Object.prototype;
const toString = objectProto.toString;
const hasOwnProperty = objectProto.hasOwnProperty;
const slice = Array.prototype.slice;
const fromCharCode = String.fromCharCode;

export function typeOf(obj) {
  return toString.call(obj).slice(8, -1).toLowerCase();
}

export function isNumber(num) {
  return typeof num === 'number' && !isNaN(num);
}

export function isUndefined(obj) {
  return typeof obj === 'undefined';
}

export function isObject(obj) {
  return typeof obj === 'object' && obj !== null;
}

export function isPlainObject(obj) {
  if (!isObject(obj)) {
    return false;
  }

  try {
    const constructor = obj.constructor;
    const prototype = constructor.prototype;

    return constructor && prototype && hasOwnProperty.call(prototype, 'isPrototypeOf');
  } catch (e) {
    return false;
  }
}

export function isFunction(fn) {
  return typeOf(fn) === 'function';
}

export function isArray(arr) {
  return Array.isArray ? Array.isArray(arr) : typeOf(arr) === 'array';
}

export function toArray(obj, offset) {
  offset = offset >= 0 ? offset : 0;

  if (Array.from) {
    return Array.from(obj).slice(offset);
  }

  return slice.call(obj, offset);
}

export function trim(str) {
  if (typeof str === 'string') {
    str = str.trim ? str.trim() : str.replace(REGEXP_TRIM, '$1');
  }

  return str;
}

export function each(obj, callback) {
  if (obj && isFunction(callback)) {
    let i;

    if (isArray(obj) || isNumber(obj.length)/* array-like */) {
      const length = obj.length;

      for (i = 0; i < length; i += 1) {
        if (callback.call(obj, obj[i], i, obj) === false) {
          break;
        }
      }
    } else if (isObject(obj)) {
      Object.keys(obj).forEach((key) => {
        callback.call(obj, obj[key], key, obj);
      });
    }
  }

  return obj;
}

export function extend(obj, ...args) {
  if (isObject(obj) && args.length > 0) {
    if (Object.assign) {
      return Object.assign(obj, ...args);
    }

    args.forEach((arg) => {
      if (isObject(arg)) {
        Object.keys(arg).forEach((key) => {
          obj[key] = arg[key];
        });
      }
    });
  }

  return obj;
}

export function proxy(fn, context, ...args) {
  return (...args2) => {
    return fn.apply(context, args.concat(args2));
  };
}

export function setStyle(element, styles) {
  const style = element.style;

  each(styles, (value, property) => {
    if (REGEXP_SUFFIX.test(property) && isNumber(value)) {
      value += 'px';
    }

    style[property] = value;
  });
}

export function hasClass(element, value) {
  return element.classList ?
    element.classList.contains(value) :
    element.className.indexOf(value) > -1;
}

export function addClass(element, value) {
  if (!value) {
    return;
  }

  if (isNumber(element.length)) {
    each(element, (elem) => {
      addClass(elem, value);
    });
    return;
  }

  if (element.classList) {
    element.classList.add(value);
    return;
  }

  const className = trim(element.className);

  if (!className) {
    element.className = value;
  } else if (className.indexOf(value) < 0) {
    element.className = `${className} ${value}`;
  }
}

export function removeClass(element, value) {
  if (!value) {
    return;
  }

  if (isNumber(element.length)) {
    each(element, (elem) => {
      removeClass(elem, value);
    });
    return;
  }

  if (element.classList) {
    element.classList.remove(value);
    return;
  }

  if (element.className.indexOf(value) >= 0) {
    element.className = element.className.replace(value, '');
  }
}

export function toggleClass(element, value, added) {
  if (!value) {
    return;
  }

  if (isNumber(element.length)) {
    each(element, (elem) => {
      toggleClass(elem, value, added);
    });
    return;
  }

  // IE10-11 doesn't support the second parameter of `classList.toggle`
  if (added) {
    addClass(element, value);
  } else {
    removeClass(element, value);
  }
}

export function hyphenate(str) {
  return str.replace(REGEXP_HYPHENATE, '$1-$2').toLowerCase();
}

export function getData(element, name) {
  if (isObject(element[name])) {
    return element[name];
  } else if (element.dataset) {
    return element.dataset[name];
  }

  return element.getAttribute(`data-${hyphenate(name)}`);
}

export function setData(element, name, data) {
  if (isObject(data)) {
    element[name] = data;
  } else if (element.dataset) {
    element.dataset[name] = data;
  } else {
    element.setAttribute(`data-${hyphenate(name)}`, data);
  }
}

export function removeData(element, name) {
  if (isObject(element[name])) {
    delete element[name];
  } else if (element.dataset) {
    // #128 Safari not allows to delete dataset property
    try {
      delete element.dataset[name];
    } catch (e) {
      element.dataset[name] = null;
    }
  } else {
    element.removeAttribute(`data-${hyphenate(name)}`);
  }
}

export function removeListener(element, type, handler) {
  const types = trim(type).split(REGEXP_SPACES);

  if (types.length > 1) {
    each(types, (t) => {
      removeListener(element, t, handler);
    });
    return;
  }

  if (element.removeEventListener) {
    element.removeEventListener(type, handler, false);
  } else if (element.detachEvent) {
    element.detachEvent(`on${type}`, handler);
  }
}

export function addListener(element, type, handler, once) {
  const types = trim(type).split(REGEXP_SPACES);
  const originalHandler = handler;

  if (types.length > 1) {
    each(types, (t) => {
      addListener(element, t, handler);
    });
    return;
  }

  if (once) {
    handler = (...args) => {
      removeListener(element, type, handler);

      return originalHandler.apply(element, args);
    };
  }

  if (element.addEventListener) {
    element.addEventListener(type, handler, false);
  } else if (element.attachEvent) {
    element.attachEvent(`on${type}`, handler);
  }
}

export function dispatchEvent(element, type, data) {
  if (element.dispatchEvent) {
    let event;

    // Event and CustomEvent on IE9-11 are global objects, not constructors
    if (isFunction(Event) && isFunction(CustomEvent)) {
      if (isUndefined(data)) {
        event = new Event(type, {
          bubbles: true,
          cancelable: true,
        });
      } else {
        event = new CustomEvent(type, {
          detail: data,
          bubbles: true,
          cancelable: true,
        });
      }
    } else if (isUndefined(data)) {
      event = document.createEvent('Event');
      event.initEvent(type, true, true);
    } else {
      event = document.createEvent('CustomEvent');
      event.initCustomEvent(type, true, true, data);
    }

    // IE9+
    return element.dispatchEvent(event);
  } else if (element.fireEvent) {
    // IE6-10 (native events only)
    return element.fireEvent(`on${type}`);
  }

  return true;
}

export function getEvent(event) {
  const e = event || window.event;

  // Fix target property (IE8)
  if (!e.target) {
    e.target = e.srcElement || document;
  }

  if (!isNumber(e.pageX) && isNumber(e.clientX)) {
    const eventDoc = event.target.ownerDocument || document;
    const doc = eventDoc.documentElement;
    const body = eventDoc.body;

    e.pageX = e.clientX + (
      ((doc && doc.scrollLeft) || (body && body.scrollLeft) || 0) -
      ((doc && doc.clientLeft) || (body && body.clientLeft) || 0)
    );
    e.pageY = e.clientY + (
      ((doc && doc.scrollTop) || (body && body.scrollTop) || 0) -
      ((doc && doc.clientTop) || (body && body.clientTop) || 0)
    );
  }

  return e;
}

export function getOffset(element) {
  const doc = document.documentElement;
  const box = element.getBoundingClientRect();

  return {
    left: box.left + (
      (window.scrollX || (doc && doc.scrollLeft) || 0) - ((doc && doc.clientLeft) || 0)
    ),
    top: box.top + (
      (window.scrollY || (doc && doc.scrollTop) || 0) - ((doc && doc.clientTop) || 0)
    ),
  };
}

export function getByTag(element, tagName) {
  return element.getElementsByTagName(tagName);
}

export function getByClass(element, className) {
  return element.getElementsByClassName ?
    element.getElementsByClassName(className) :
    element.querySelectorAll(`.${className}`);
}

export function createElement(tagName) {
  return document.createElement(tagName);
}

export function appendChild(element, elem) {
  element.appendChild(elem);
}

export function removeChild(element) {
  if (element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

export function empty(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function isCrossOriginURL(url) {
  const parts = url.match(REGEXP_ORIGINS);

  return parts && (
    parts[1] !== location.protocol ||
    parts[2] !== location.hostname ||
    parts[3] !== location.port
  );
}

export function addTimestamp(url) {
  const timestamp = `timestamp=${(new Date()).getTime()}`;

  return (url + (url.indexOf('?') === -1 ? '?' : '&') + timestamp);
}

export function getImageSize(image, callback) {
  // Modern browsers (ignore Safari)
  if (image.naturalWidth && !IS_SAFARI_OR_UIWEBVIEW) {
    callback(image.naturalWidth, image.naturalHeight);
    return;
  }

  // IE8: Don't use `new Image()` here
  const newImage = createElement('img');

  newImage.onload = function load() {
    callback(this.width, this.height);
  };

  newImage.src = image.src;
}

export function getTransforms(data) {
  const transforms = [];
  const translateX = data.translateX;
  const translateY = data.translateY;
  const rotate = data.rotate;
  const scaleX = data.scaleX;
  const scaleY = data.scaleY;

  if (isNumber(translateX) && translateX !== 0) {
    transforms.push(`translateX(${translateX}px)`);
  }

  if (isNumber(translateY) && translateY !== 0) {
    transforms.push(`translateY(${translateY}px)`);
  }

  // Rotate should come first before scale to match orientation transform
  if (isNumber(rotate) && rotate !== 0) {
    transforms.push(`rotate(${rotate}deg)`);
  }

  if (isNumber(scaleX) && scaleX !== 1) {
    transforms.push(`scaleX(${scaleX})`);
  }

  if (isNumber(scaleY) && scaleY !== 1) {
    transforms.push(`scaleY(${scaleY})`);
  }

  const transform = transforms.length ? transforms.join(' ') : 'none';

  return {
    WebkitTransform: transform,
    msTransform: transform,
    transform,
  };
}

const isFinite = window.isFinite;

export function getContainSizes(
  {
    aspectRatio,
    height,
    width,
  },
) {
  const isValidNumber = (value) => {
    return isFinite(value) && value > 0;
  };

  if (isValidNumber(width) && isValidNumber(height)) {
    if (height * aspectRatio > width) {
      height = width / aspectRatio;
    } else {
      width = height * aspectRatio;
    }
  } else if (isValidNumber(width)) {
    height = width / aspectRatio;
  } else if (isValidNumber(height)) {
    width = height * aspectRatio;
  }

  return {
    width,
    height,
  };
}

export function getRotatedSizes(
  {
    aspectRatio,
    degree,
    height,
    width,
  },
  reversed = false,
) {
  const arc = ((Math.abs(degree) % 90) * Math.PI) / 180;
  const sinArc = Math.sin(arc);
  const cosArc = Math.cos(arc);
  let newWidth;
  let newHeight;

  if (!reversed) {
    newWidth = (width * cosArc) + (height * sinArc);
    newHeight = (width * sinArc) + (height * cosArc);
  } else {
    newWidth = width / (cosArc + (sinArc / aspectRatio));
    newHeight = newWidth / aspectRatio;
  }

  return {
    width: newWidth,
    height: newHeight,
  };
}

export function getSourceCanvas(
  image,
  {
    aspectRatio: imageAspectRatio,
    rotate,
    scaleX,
    scaleY,
  },
  {
    aspectRatio,
    naturalWidth,
    naturalHeight,
  },
  {
    fillColor,
    imageSmoothingEnabled,
    imageSmoothingQuality,
    maxWidth,
    maxHeight,
    minWidth,
    minHeight,
  },
) {
  const scaled = isNumber(scaleX) && isNumber(scaleY) && (scaleX !== 1 || scaleY !== 1);
  const rotated = isNumber(rotate) && rotate !== 0;
  let width = naturalWidth;
  let height = naturalHeight;

  const maxSizes = getContainSizes({
    aspectRatio,
    width: maxWidth || Infinity,
    height: maxHeight || Infinity,
  });
  const minSizes = getContainSizes({
    aspectRatio,
    width: minWidth || 0,
    height: minHeight || 0,
  });

  width = Math.min(maxSizes.width, Math.max(minSizes.width, width));
  height = Math.min(maxSizes.height, Math.max(minSizes.height, height));

  const canvas = createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = fillColor || 'transparent';
  context.fillRect(0, 0, width, height);
  context.save();
  context.translate(width / 2, height / 2);

  // Rotate first before scale (as in the "getTransform" function)
  if (rotated) {
    context.rotate((rotate * Math.PI) / 180);
  }

  if (scaled) {
    context.scale(scaleX, scaleY);
  }

  context.imageSmoothingEnabled = !!imageSmoothingEnabled;

  if (imageSmoothingQuality) {
    context.imageSmoothingQuality = imageSmoothingQuality;
  }

  let dstWidth = width;
  let dstHeight = height;

  if (rotated) {
    const reversed = getRotatedSizes({
      width,
      height,
      aspectRatio: imageAspectRatio,
      degree: rotate,
    }, true);

    dstWidth = reversed.width;
    dstHeight = reversed.height;
  }

  context.drawImage(
    image,
    Math.floor(-dstWidth / 2),
    Math.floor(-dstHeight / 2),
    Math.floor(dstWidth),
    Math.floor(dstHeight),
  );

  context.restore();

  return canvas;
}

export function getStringFromCharCode(dataView, start, length) {
  let str = '';
  let i = start;

  for (length += start; i < length; i += 1) {
    str += fromCharCode(dataView.getUint8(i));
  }

  return str;
}

export function getOrientation(arrayBuffer) {
  const dataView = new DataView(arrayBuffer);
  let length = dataView.byteLength;
  let orientation;
  let exifIDCode;
  let tiffOffset;
  let firstIFDOffset;
  let littleEndian;
  let endianness;
  let app1Start;
  let ifdStart;
  let offset;
  let i;

  // Only handle JPEG image (start by 0xFFD8)
  if (dataView.getUint8(0) === 0xFF && dataView.getUint8(1) === 0xD8) {
    offset = 2;

    while (offset < length) {
      if (dataView.getUint8(offset) === 0xFF && dataView.getUint8(offset + 1) === 0xE1) {
        app1Start = offset;
        break;
      }

      offset += 1;
    }
  }

  if (app1Start) {
    exifIDCode = app1Start + 4;
    tiffOffset = app1Start + 10;

    if (getStringFromCharCode(dataView, exifIDCode, 4) === 'Exif') {
      endianness = dataView.getUint16(tiffOffset);
      littleEndian = endianness === 0x4949;

      if (littleEndian || endianness === 0x4D4D /* bigEndian */) {
        if (dataView.getUint16(tiffOffset + 2, littleEndian) === 0x002A) {
          firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian);

          if (firstIFDOffset >= 0x00000008) {
            ifdStart = tiffOffset + firstIFDOffset;
          }
        }
      }
    }
  }

  if (ifdStart) {
    length = dataView.getUint16(ifdStart, littleEndian);

    for (i = 0; i < length; i += 1) {
      offset = ifdStart + (i * 12) + 2;

      if (dataView.getUint16(offset, littleEndian) === 0x0112 /* Orientation */) {
        // 8 is the offset of the current tag's value
        offset += 8;

        // Get the original orientation value
        orientation = dataView.getUint16(offset, littleEndian);

        // Override the orientation with its default value for Safari
        if (IS_SAFARI_OR_UIWEBVIEW) {
          dataView.setUint16(offset, 1, littleEndian);
        }

        break;
      }
    }
  }

  return orientation;
}

export function dataURLToArrayBuffer(dataURL) {
  const base64 = dataURL.replace(REGEXP_DATA_URL_HEAD, '');
  const binary = atob(base64);
  const length = binary.length;
  const arrayBuffer = new ArrayBuffer(length);
  const dataView = new Uint8Array(arrayBuffer);
  let i;

  for (i = 0; i < length; i += 1) {
    dataView[i] = binary.charCodeAt(i);
  }

  return arrayBuffer;
}

// Only available for JPEG image
export function arrayBufferToDataURL(arrayBuffer) {
  const dataView = new Uint8Array(arrayBuffer);
  const length = dataView.length;
  let base64 = '';
  let i;

  for (i = 0; i < length; i += 1) {
    base64 += fromCharCode(dataView[i]);
  }

  return `data:image/jpeg;base64,${btoa(base64)}`;
}
