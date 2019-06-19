class Collision {
	static aabb(rect1, rect2) {
		if(!rect2.w) rect2 = new Rectangle(rect2.x, rect2.y, 0, 0)
		return rect1.x + rect1.w > rect2.x && rect1.x < rect2.x + rect2.w && 
			rect1.y + rect1.h > rect2.y && rect1.y < rect2.y + rect2.h
	}
	static circle(cir1, cir2) {
		let x = cir2.x - cir1.x
		let y = cir2.y - cir1.y
		let d = Math.hypot(x, y) || 0.0001
		let dMax = cir1.r + cir2.r
		let penetration = dMax - d
		if(d < dMax) {
			return { cir1, cir2, x, y, d, dMax, penetration }
		} else return false
	}
}

class Realm extends Rectangle {
	constructor(x, y, w, h) {
		super(x, y, w, h)
		this.qt = new Quadtree(null, null, 0, x, y, w, h)
		this.polygons = []
	}
	addPolygon(p) {
		this.qt.insert(p)
		this.polygons.push(p)
	}
	removePolygon(p) {
		Quadtree.remove(p)
		let i = this.polygons.indexOf(p)
		i > -1 && this.polygons.splice(i, 1)
	}
	spawn(pName, num, rect, prob) {
		rect = rect || new Rectangle(0, 0, this.w, this.h)
		let pNames = {
			'square': Square,
			'triangle': Triangle,
			'pentagon': Pentagon
		}
		let P = pNames[pName]
		if(!P) throw new Error('Invalid polygon name.')
		while(num--) {
			let p = new P(this.x + rect.x + Math.random() * rect.w, 
				this.y + rect.y + Math.random() * rect.h, 
				pName == 'pentagon' ? 
					prob ? (Math.random() < prob ? true : false) : 
						(Math.random() < 0.02 ? true : false) : false)
			this.addPolygon(p)
		}
	}
	update() {
		this.polygons.forEach(p => {
			if(p.destroyed) return false
			if(!Collision.aabb(p.qtNode, p)) {
				Quadtree.update(p) 
			}

			if(p.isBullet == false) {
				p.x = Math.max(this.x, Math.min(p.x, this.x + this.w))
				p.y = Math.max(this.y, Math.min(p.y, this.y + this.h))
			}

			p.move()
			!p.isTank && p.spin(45, 10000)
			!p.isTank && p.float()
			p.isTank && p.update()
			let s = p.r * 4
			this.qt.query(new Rectangle(p.x - s/2, p.y - s/2, s, s), (a) => {
				if(a != p && !a.destroyed) {
					if(a.owner == p || p.owner == a) 
						return

					if(a.isBullet && p.isBullet) return

					let data = Collision.circle(p, a)
					if(data) {
						let { x, y, d, dMax, penetration } = data
						penetration /= 2
						let v = 0.08
						if(true) {
							p.x += -x / d * penetration
							p.y += -y / d * penetration
							a.x += x / d * penetration
							a.y += y / d * penetration
							p.setRepelVector(-x/d * v * a.r/dMax, -y/d * v * a.r/dMax, 1000)
							a.setRepelVector(x/d * v * p.r/dMax, y/d * v * p.r/dMax, 1000)
						}
						if((a.isSquare || a.isTriangle || a.isPentagon) && (p.isSquare || p.isTriangle || p.isPentagon))
							return

						if(p.isTank) {
							p.healthRegenTimer = 0
						}
						if(a.isTank) {
							a.healthRegenTimer = 0
						}


						let pd = p.getBodyDamage()
						let ad = a.getBodyDamage()
						p.health -= ad
						a.health -= pd

						if(a == tank) return false

						if(a.health <= 0) {
							a.destroy()
							p.isTank && p.setScore(p.score + 10)
							p.owner && p.owner.setScore(p.owner.score + 10)
						}
						if(p.health <= 0) {
							p.destroy()
							a.isTank && a.setScore(a.score + 10)
								a.owner && a.owner.setScore(a.owner.score + 10)
						}
						p.blinkAnim = 0.5
						a.blinkAnim = 0.5
					}
				}
			}) 
		})
	}
}