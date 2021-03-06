/*
 * MelonJS Game Engine
 * Copyright (C) 2012, Olivier BIOT
 * http://www.melonjs.org
 *
 * Tile QT 0.7.x format
 * http://www.mapeditor.org/	
 *
 */

(function($, undefined) {
		
	/**************************************************/
	/*                                                */
	/*      Tileset Management                        */
	/*                                                */
	/**************************************************/
	
	/**
	 * a basic tile object
	 * @class
	 * @extends me.Rect
	 * @memberOf me
	 * @constructor
	 * @param {int} x x index of the Tile in the map
	 * @param {int} y y index of the Tile in the map
	 * @param {int} w Tile width
	 * @param {int} h Tile height
	 * @param {int} tileId tileId>
	 */
	me.Tile = me.Rect.extend({
		 /**
		  * tileId
		  * @public
		  * @type int
		  * @name me.Tile#tileId
		  */
		tileId : null,
		
		/** @private */
		init : function(x, y, w, h, tileId) {
			this.parent(new me.Vector2d(x * w, y * h), w, h);
			// tileID
			this.tileId = tileId;
			// Tile row / col pos
			this.row = x;
			this.col = y;
		}
	});

	/**
	 * a Tile Set Object
	 * @class
	 * @memberOf me
	 * @constructor
	 */
	me.Tileset = Object.extend({
		// constructor
		init: function (name, tilewidth, tileheight, spacing, margin, imagesrc) {
			this.name = name;
			this.tilewidth = tilewidth;
			this.tileheight = tileheight;
			this.spacing = spacing;
			this.margin = margin;
			this.image = (imagesrc) ? me.loader.getImage(me.utils.getFilename(imagesrc)) : null;
			
			if (!this.image) {
				console.log("melonJS: '" + imagesrc + "' file for tileset '" + this.name + "' not found!");
			}
			
			
			// tile types
			this.type = {
				SOLID : "solid",
				PLATFORM : "platform",
				L_SLOPE : "lslope",
				R_SLOPE : "rslope",
				LADDER : "ladder",
				BREAKABLE : "breakable"
			};

			// tile properties
			// (collidable, etc..)
			this.TileProperties = [];
			
			// a cache for offset value
			this.tileXOffset = [];
			this.tileYOffset = [];

			// number of tiles per horizontal line 
			if (this.image) {
				this.hTileCount = ~~((this.image.width - this.margin) / (this.tilewidth + this.spacing));
				this.vTileCount = ~~((this.image.height - this.margin) / (this.tileheight + this.spacing));
			}
		},
		
		// return the list of property for a tile
		getPropertyList: function() {
			return {
				// collectable tiles
				//isCollectable	: false,
				// collidable tiles
				isCollidable : false,
				isSolid : false,
				isPlatform : false,
				isSlope : false,
				isLeftSlope : false,
				isRightSlope : false,
				isLadder : false,
				isBreakable : false
			};
		},
		
		// 
		// e.g. getTileProperty (gid)	
		/**
		 * return the properties of the specified tile <br>
		 * the function will return an object with the following boolean value :<br>
		 * - isCollidable<br>
		 * - isSolid<br>
		 * - isPlatform<br>
		 * - isSlope <br>
		 * - isLeftSlope<br>
		 * - isRightSlope<br>
		 * - isLadder<br>
		 * - isBreakable<br>
		 * @name me.Tileset#getTileProperties
		 * @public
		 * @function
		 * @param {Integer} tileId 
		 * @return {Object}
		 */
		getTileProperties: function(tileId) {
			return this.TileProperties[tileId];
		},
		
		//return collidable status of the specifiled tile

		isTileCollidable : function(tileId) {
			return this.TileProperties[tileId].isCollidable;
		},

		/*
		//return collectable status of the specifiled tile
		isTileCollectable : function (tileId) {
			return this.TileProperties[tileId].isCollectable;
		},
		 */

		//return an Image Object with the specified tile
		getTileImage : function(tileId) {
			// create a new image object
			var image = me.video.createCanvasSurface(this.tilewidth, this.tileheight);
			this.drawTile(image, 0, 0, tileId);
			return image.canvas;
		},
		
		// return the x offset of the specified tile in the tileset image
		getTileOffsetX : function(tileId) {
			if (this.tileXOffset[tileId] == null) {
				this.tileXOffset[tileId] = this.margin + (this.spacing + this.tilewidth)  * (tileId % this.hTileCount);
			}
			return this.tileXOffset[tileId];
		},
		
		// return the y offset of the specified tile in the tileset image
		getTileOffsetY : function(tileId) {
			if (this.tileYOffset[tileId] == null) {
				this.tileYOffset[tileId] = this.margin + (this.spacing + this.tileheight)	* ~~(tileId / this.hTileCount);
			}
			return this.tileYOffset[tileId];
		},
		

		// draw the x,y tile
		drawTile : function(context, dx, dy, tileId, flipx, flipy, flipad) {
			// check if any transformation is required
			if (flipx || flipy || flipad) {
				var m11 = 1; // Horizontal scaling factor
				var m12 = 0; // Vertical shearing factor
				var m21 = 0; // Horizontal shearing factor
				var m22 = 1; // Vertical scaling factor
				var mx	= dx; 
				var my	= dy;
				// set initial value to zero since we use a transform matrix
				dx = dy = 0;
				
				if (flipad){
					// Use shearing to swap the X/Y axis
					m11=0;
					m12=1;
					m21=1;
					m22=0;
					// Compensate for the swap of image dimensions
					my += this.tileheight - this.tilewidth;
				}
				if (flipx){
					m11 = -m11;
					m21 = -m21;
					mx += flipad ? this.tileheight : this.tilewidth;
					
				}
				if (flipy){
					m12 = -m12;
					m22 = -m22;
					my += flipad ? this.tilewidth : this.tileheight;
				}
				// set the transform matrix
				context.setTransform(m11, m12, m21, m22, mx, my);
			}
			
			// draw the tile
			context.drawImage(this.image, 
							  this.getTileOffsetX(tileId), this.getTileOffsetY(tileId),
							  this.tilewidth, this.tileheight, 
							  dx, dy, 
							  this.tilewidth, this.tileheight);

			if  (flipx || flipy || flipad)  {
				// restore the transform matrix to the normal one
				context.setTransform(1, 0, 0, 1, 0, 0);
			}
		}
	});
	

	
    /**
	 * a TMX Tile Set Object
	 * @class
	 * @extends me.Tileset
	 * @memberOf me
	 * @constructor
	 */
	 me.TMXTileset = me.Tileset.extend({
		
		// constructor
		init: function (xmltileset) {

			// first gid
			this.firstgid = me.XMLParser.getIntAttribute(xmltileset, me.TMX_TAG_FIRSTGID);
			
			this.parent(me.XMLParser.getStringAttribute(xmltileset, me.TMX_TAG_NAME),
						me.XMLParser.getIntAttribute(xmltileset, me.TMX_TAG_TILEWIDTH),
						me.XMLParser.getIntAttribute(xmltileset, me.TMX_TAG_TILEHEIGHT),
						me.XMLParser.getIntAttribute(xmltileset, me.TMX_TAG_SPACING, 0), 
						me.XMLParser.getIntAttribute(xmltileset, me.TMX_TAG_MARGIN, 0), 
						xmltileset.getElementsByTagName(me.TMX_TAG_IMAGE)[0].getAttribute(me.TMX_TAG_SOURCE));
			
			// compute the last gid value in the tileset
			this.lastgid = this.firstgid + ( ((this.hTileCount * this.vTileCount) - 1) || 0);
		  
			// check if transparency is defined for a specific color
			this.trans = xmltileset.getElementsByTagName(me.TMX_TAG_IMAGE)[0].getAttribute(me.TMX_TAG_TRANS);

			// set Color Key for transparency if needed
			if (this.trans !== null && this.image) {
				// applyRGB Filter (return a context object)
				this.image = me.video.applyRGBFilter(this.image, "transparent", this.trans.toUpperCase()).canvas;
			}
			
			// set tile offset properties (if any)
			this.tileoffset = new me.Vector2d(0,0);
			var offset = xmltileset.getElementsByTagName(me.TMX_TAG_TILEOFFSET);
			if (offset.length>0) {
				this.tileoffset.x = me.XMLParser.getIntAttribute(offset[0], me.TMX_TAG_X);
				this.tileoffset.y = me.XMLParser.getIntAttribute(offset[0], me.TMX_TAG_Y);
			}

			// set tile properties, if any
			var tileInfo = xmltileset.getElementsByTagName(me.TMX_TAG_TILE);
			for ( var i = 0; i < tileInfo.length; i++) {
				var tileID = me.XMLParser.getIntAttribute(tileInfo[i], me.TMX_TAG_ID) + this.firstgid;

				this.TileProperties[tileID] = {};

				var tileProp = this.TileProperties[tileID];

				// apply tiled defined properties
				me.TMXUtils.setTMXProperties(tileProp, tileInfo[i]);

				// check what we found and adjust property
				tileProp.isSolid = tileProp.type ? tileProp.type.toLowerCase() === this.type.SOLID : false;
				tileProp.isPlatform = tileProp.type ? tileProp.type.toLowerCase() === this.type.PLATFORM : false;
				tileProp.isLeftSlope = tileProp.type ? tileProp.type.toLowerCase() === this.type.L_SLOPE : false;
				tileProp.isRightSlope = tileProp.type ? tileProp.type.toLowerCase() === this.type.R_SLOPE	: false;
				tileProp.isBreakable = tileProp.type ? tileProp.type.toLowerCase() === this.type.BREAKABLE : false;
				tileProp.isLadder = tileProp.type ? tileProp.type.toLowerCase() === this.type.LADDER : false;
				tileProp.isSlope = tileProp.isLeftSlope || tileProp.isRightSlope;

				// ensure the collidable flag is correct
				tileProp.isCollidable = tileProp.isSolid || tileProp.isPlatform
										|| tileProp.isSlope || tileProp.isLadder
										|| tileProp.isBreakable;

			}
		},
		
		/**
		 * return true if the gid belongs to the tileset
		 * @name me.TMXTileset#contains
		 * @public
		 * @function
		 * @param {Integer} gid 
		 * @return {boolean}
		 */
		contains : function(gid) {
			return (gid >= this.firstgid && gid <= this.lastgid)
		}

	});
	
	/**
	 * an object containing all tileset
	 * @class
	 * @memberOf me
	 * @constructor
	 */
	me.TMXTilesetGroup = Object.extend({
		// constructor
		init: function () {
			this.tilesets = [];
		},
		
		//add a tileset to the tileset group
		add : function(tileset) {
			this.tilesets.push(tileset);
		},

		//return the tileset at the specified index
		getTilesetByIndex : function(i) {
			return this.tilesets[i];
		},
	   
		/**
		 * return the tileset corresponding to the specified id <br>
		 * will throw an exception if no matching tileset is found
		 * @name me.TMXTilesetGroup#getTilesetByGid
		 * @public
		 * @function
		 * @param {Integer} gid 
		 * @return {me.TMXTileset} corresponding tileset
		 */
		getTilesetByGid : function(gid) {
			var invalidRange = -1;
			// cycle through all tilesets
			for ( var i = 0, len = this.tilesets.length; i < len; i++) {
				// return the corresponding tileset if matching
				if (this.tilesets[i].contains(gid))
					return this.tilesets[i];
				// typically indicates a layer with no asset loaded (collision?)
				if (this.tilesets[i].firstgid == this.tilesets[i].lastgid) {
					if (gid >= this.tilesets[i].firstgid)
					// store the id if the [firstgid .. lastgid] is invalid
					invalidRange = i;
				}
			}
			// return the tileset with the invalid range
			if (invalidRange!=-1)
				return this.tilesets[invalidRange];
			else
			throw "no matching tileset found for gid " + gid;
		}
		
	});
	
	
	/*---------------------------------------------------------*/
	// END END END
	/*---------------------------------------------------------*/
})(window);
