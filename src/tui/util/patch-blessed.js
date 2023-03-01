/*
 * This patch fixes the issue: https://github.com/chjj/blessed/issues/77
 * */

const blessed = require("blessed");

blessed.element.prototype._getCoords = function (get, noscroll) {
  if (this.hidden) return;

  // if (this.parent._rendering) {
  //   get = true;
  // }

  var xi = this._getLeft(get),
    xl = xi + this._getWidth(get),
    yi = this._getTop(get),
    yl = yi + this._getHeight(get),
    base = this.childBase || 0,
    el = this,
    fixed = this.fixed,
    coords,
    v,
    noleft,
    noright,
    notop,
    nobot,
    ppos,
    b;

  // Attempt to shrink the element base on the
  // size of the content and child elements.
  if (this.shrink) {
    coords = this._getShrink(xi, xl, yi, yl, get);
    (xi = coords.xi), (xl = coords.xl);
    (yi = coords.yi), (yl = coords.yl);
  }

  // Find a scrollable ancestor if we have one.
  while ((el = el.parent)) {
    if (el.scrollable) {
      if (fixed) {
        fixed = false;
        continue;
      }
      el = this.parent;
      break;
    }
  }

  // Check to make sure we're visible and
  // inside of the visible scroll area.
  // NOTE: Lists have a property where only
  // the list items are obfuscated.

  // Old way of doing things, this would not render right if a shrunken element
  // with lots of boxes in it was within a scrollable element.
  // See: $ node test/widget-shrink-fail.js
  // var thisparent = this.parent;

  var thisparent = el;
  if (el && !noscroll) {
    ppos = thisparent.lpos;

    // The shrink option can cause a stack overflow
    // by calling _getCoords on the child again.
    // if (!get && !thisparent.shrink) {
    //   ppos = thisparent._getCoords();
    // }

    if (!ppos) return;

    // TODO: Figure out how to fix base (and cbase to only
    // take into account the *parent's* padding.

    yi -= ppos.base;
    yl -= ppos.base;

    b = thisparent.border ? 1 : 0;

    // XXX
    // Fixes non-`fixed` labels to work with scrolling (they're ON the border):
    // if (this.position.left < 0
    //     || this.position.right < 0
    //     || this.position.top < 0
    //     || this.position.bottom < 0) {
    if (this._isLabel) {
      b = 0;
    }

    if (yi < ppos.yi + b) {
      if (yl - 1 < ppos.yi + b) {
        // Is above.
        return;
      } else {
        // Is partially covered above.
        notop = true;
        v = ppos.yi - yi;
        if (this.border) v--;
        if (thisparent.border) v++;
        base += v;
        yi += v;
      }
    } else if (yl > ppos.yl - b) {
      if (yi > ppos.yl - 1 - b) {
        // Is below.
        return;
      } else {
        // Is partially covered below.
        nobot = true;
        v = yl - ppos.yl;
        if (this.border) v--;
        if (thisparent.border) v++;
        yl -= v;
      }
    }

    // Shouldn't be necessary.
    // assert.ok(yi < yl);
    if (yi >= yl) return;

    // Could allow overlapping stuff in scrolling elements
    // if we cleared the pending buffer before every draw.
    if (xi < el.lpos.xi) {
      xi = el.lpos.xi;
      noleft = true;
      if (this.border) xi--;
      if (thisparent.border) xi++;
    }
    if (xl > el.lpos.xl) {
      xl = el.lpos.xl;
      noright = true;
      if (this.border) xl++;
      if (thisparent.border) xl--;
    }
    //if (xi > xl) return;
    if (xi >= xl) return;
  }

  if (this.noOverflow && this.parent.lpos) {
    if (xi < this.parent.lpos.xi + this.parent.ileft) {
      xi = this.parent.lpos.xi + this.parent.ileft;
    }
    if (xl > this.parent.lpos.xl - this.parent.iright) {
      xl = this.parent.lpos.xl - this.parent.iright;
    }
    if (yi < this.parent.lpos.yi + this.parent.itop) {
      yi = this.parent.lpos.yi + this.parent.itop;
    }
    if (yl > this.parent.lpos.yl - this.parent.ibottom) {
      yl = this.parent.lpos.yl - this.parent.ibottom;
    }
  }

  // if (this.parent.lpos) {
  //   this.parent.lpos._scrollBottom = Math.max(
  //     this.parent.lpos._scrollBottom, yl);
  // }

  return {
    xi: xi,
    xl: xl,
    yi: yi,
    yl: yl,
    base: base,
    noleft: noleft,
    noright: noright,
    notop: notop,
    nobot: nobot,
    renders: this.screen.renders,
  };
};

module.exports = {};
