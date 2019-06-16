const maxChildren = 4
const maxDepth = 10

class Rectangle {
	constructor(x, y, w, h) {
		this.x = x
		this.y = y 
		this.w = w
		this.h = h
	}
	draw(ctx) {
		ctx.strokeStyle = 'red'
		ctx.strokeRect(this.x, this.y, this.w, this.h)
	}
}

class Quadtree extends Rectangle {
	constructor(root, parent, depth, x, y, w, h) {
		super(x, y, w, h)
		this.nodes = []
		this.items = []
		this.root = root || this
		this.parent = parent || this
		this.depth = depth || 0
	}
	static remove(a, callback) {
		if(!callback) callback = (updated) => { }
		if(a.qtNode == null) {
			return callback(false)
		} else {
			let l = a.qtNode.items.indexOf(a)
			if(l > -1) {
				a.qtNode.items.splice(l, 1)
				let items = a.qtNode.parent.getItems()
				a.qtNode.parent.clear()
				for(let m = 0; m < items.length; m++) a.qtNode.parent.insert(items[m])
				callback(true)
			} else {
				callback(false)
			}
		}
	}
	static update(a, callback) {
		if(!callback) callback = (updated) => {  }
		Quadtree.remove(a, (removed) => {
			if(removed == true) {
				a.qtNode.root.insert(a)
				callback(true)
			} else callback(false)
		})
	}
	clear() {
		for(let x = 0; x < this.nodes.length; x++) this.nodes[x].clear()
		this.nodes.length = 0
		this.items.length = 0
	}
	getItems() {
		let items = []
		this.query(this, a => items.push(a))
		return items
	}
	query(range, callback) {
		if(Collision.aabb(this, range)) {
			for(let j = 0; j < this.items.length; j++) callback(this.items[j])
			if(this.nodes.length > 0) {
				for(let i = 0; i < this.nodes.length; i++) this.nodes[i].query(range, callback)
			}
		}
	}
	divide() {
		let a = this.depth + 1
		let c = this.w / 2
		let d = this.h / 2
		this.nodes.push(new Quadtree(this.root, this, a, this.x, this.y, c, d))
		this.nodes.push(new Quadtree(this.root, this, a, this.x + c, this.y, c, d))
		this.nodes.push(new Quadtree(this.root, this, a, this.x, this.y + d, c, d))
		this.nodes.push(new Quadtree(this.root, this, a, this.x + c, this.y + d, c, d))
		a = this.items
		this.items = []
		for(c = 0; c < a.length; c++) this.insert(a[c])
	}
	insert(a) {
		if(this.nodes.length != 0) {
			this.nodes[this.findNodeFor(a)].insert(a)
		} else {
			if(this.items.length >= maxChildren && this.depth < maxDepth) {
				this.divide()
				this.nodes[this.findNodeFor(a)].insert(a)
			} else {
				this.items.push(a)
				a.qtNode = this
			}
		}
	}
	findNodeFor(a) {
		return a.x <= this.x + this.w / 2 ? 
			(a.y <= this.y + this.h / 2 ? 0 : 2) : 
			(a.y <= this.y + this.h / 2 ? 1 : 3)
	}
	draw(ctx) {
		ctx.strokeStyle = 'red'
		ctx.lineWidth = 1
		ctx.strokeRect(this.x, this.y, this.w, this.h)
		if(this.nodes.length > 0) {
			for(let k = 0; k < this.nodes.length; k++) {
				this.nodes[k].draw(ctx)
			}
		}
	}
}

















