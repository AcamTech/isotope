/*!
 * Isotope v2.0.0
 * Magical sorting and filtering layouts
 * http://isotope.metafizzy.co
 */

( function( window ) {

'use strict';

// vars
// var document = window.document;

// -------------------------- helpers -------------------------- //

// -------------------------- isotopeDefinition -------------------------- //

// used for AMD definition and requires
function isotopeDefinition( Outlayer, getSize, matchesSelector, Item ) {
  // create an Outlayer layout class
  var Isotope = Outlayer.create( 'isotope', {
    sortAscending: true
  });

  Isotope.Item = Isotope.prototype.settings.item = Item;

  Isotope.layoutModes = {};

  Isotope.prototype._create = function() {
    this.itemGUID = 0;
    // call super
    Outlayer.prototype._create.call( this );

    // create layout modes
    this.modes = {};
    // create from registered layout modes
    for ( var name in Isotope.layoutModes ) {
      this._createLayoutMode( name );
    }
    // keep of track of sortBys
    this.sortHistory = [ 'original-order' ];
    this.updateSortData();
  };

  Isotope.prototype.reloadItems = function() {
    // reset item ID counter
    this.itemGUID = 0;
    // call super
    Outlayer.prototype.reloadItems.call( this );
  };

  Isotope.prototype._getItems = function() {
    var items = Outlayer.prototype._getItems.apply( this, arguments );
    // assign ID for original-order
    for ( var i=0, len = items.length; i < len; i++ ) {
      var item = items[i];
      item.id = this.itemGUID++;
    }
    return items;
  };

  // -------------------------- layout -------------------------- //

  Isotope.prototype._createLayoutMode = function( name ) {
    var LayoutMode = Isotope.layoutModes[ name ];
    var options = this.options[ name ];
    this.modes[ name ] = new LayoutMode( this, options );
  };

  Isotope.prototype._mode = function() {
    return this.modes[ this.options.layoutMode ];
  };

  Isotope.prototype.layout = function() {
    this.filteredItems = this._filter( this.items );
    this._sort();
    // Outlayer.prototype.layout.call( this );
    this._resetLayout();
    this._manageStamps();

    // don't animate first layout
    var isInstant = this.options.isLayoutInstant !== undefined ?
      this.options.isLayoutInstant : !this._isLayoutInited;
    this.layoutItems( this.filteredItems, isInstant );

    // flag for initalized
    this._isLayoutInited = true;
  };


  // -------------------------- filter -------------------------- //

  Isotope.prototype._filter = function( items ) {
    var filter = this.options.filter;
    filter = filter || '*';
    var matches = [];
    var hiddenMatched = [];
    var visibleUnmatched = [];

    var test = getFilterTest( filter );

    // test each item
    for ( var i=0, len = items.length; i < len; i++ ) {
      var item = items[i];
      if ( item.isIgnored ) {
        continue;
      }
      // add item to either matched or unmatched group
      var isMatched = test( item );
      item.isFilterMatched = isMatched;
      // add to matches if its a match
      if ( isMatched ) {
        matches.push( item );
      }
      // add to additional group if item needs to be hidden or revealed
      if ( isMatched && item.isHidden ) {
        hiddenMatched.push( item );
      } else if ( !isMatched && !item.isHidden ) {
        visibleUnmatched.push( item );
      }
    }

    this.reveal( hiddenMatched );
    this.hide( visibleUnmatched );

    return matches;
  };

  // get a function or a matchesSelector test given the filter
  function getFilterTest( filter ) {
    var test;
    if ( typeof filter === 'function' ) {
      test = function( item ) {
        return filter( item.element );
      };
    } else {
      test = function( item ) {
        return matchesSelector( item.element, filter );
      };
    }
    return test;
  }

  // -------------------------- sort -------------------------- //

  Isotope.prototype.updateSortData = function( items ) {
    // default to all items if none are passed in
    items = items || this.items;
    for ( var i=0, len = items.length; i < len; i++ ) {
      var item = items[i];
      item.updateSortData();
    }
  };

  // sort filteredItem order
  Isotope.prototype._sort = function() {
    var sortByOpt = this.options.sortBy;
    if ( !sortByOpt ) {
      return;
    }
    // concat all sortBy and sortHistory
    var sortBys = [].concat.apply( sortByOpt, this.sortHistory );
    var sortAsc = this.options.sortAscending;
    // sort magic
    this.filteredItems.sort( function sorter( itemA, itemB ) {
      // cycle through all sortKeys
      for ( var i = 0, len = sortBys.length; i < len; i++ ) {
        var sortBy = sortBys[i];
        var a = itemA.sortData[ sortBy ];
        var b = itemB.sortData[ sortBy ];
        if ( a > b || a < b ) {
          // if sortAsc is an object, use the value given the sortBy key
          var isAscending = sortAsc[ sortBy ] !== undefined ? sortAsc[ sortBy ] : sortAsc;
          var direction = isAscending ? 1 : -1;
          return ( a > b ? 1 : -1 ) * direction;
        }
      }
      return 0;
    });
    // keep track of sortBy History
    var lastSortBy = this.sortHistory[ this.sortHistory.length - 1 ];
    if ( sortByOpt !== lastSortBy ) {
      // add to front, oldest goes in last
      this.sortHistory.unshift( sortByOpt );
    }
  };

  // -------------------------- methods -------------------------- //

  Isotope.prototype._resetLayout = function() {
    this._mode()._resetLayout();
  };

  Isotope.prototype._getItemLayoutPosition = function( item ) {
    return this._mode()._getItemLayoutPosition( item );
  };

  Isotope.prototype._manageStamp = function( stamp ) {
    this._mode()._manageStamp( stamp );
  };

  Isotope.prototype._getContainerSize = function() {
    return this._mode()._getContainerSize();
  };

  return Isotope;
}

// -------------------------- transport -------------------------- //

if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( [
      'outlayer',
      'get-size',
      'matches-selector',
      './item.js'
    ],
    isotopeDefinition );
} else {
  // browser global
  window.Isotope = isotopeDefinition(
    window.Outlayer,
    window.getSize,
    window.matchesSelector,
    window.Isotope.Item
  );
}

})( window );
