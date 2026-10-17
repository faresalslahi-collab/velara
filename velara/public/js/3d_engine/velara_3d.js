
/**
 * Velara 3D Hotel Floor Plan
 * Integrates VL Room with frappe_visual.
 */

frappe.provide("frappe.velara.floorPlan");

frappe.velara.floorPlan = {
	_loaded: false,

	async load() {
		if (this._loaded) return;

		const loadBundle = (file) =>
			new Promise((resolve, reject) => {
				try {
					frappe.require(file, () => resolve());
				} catch (error) {
					reject(error);
				}
			});

		if (!frappe.visual) {
			await loadBundle("frappe_visual.bundle.js");
		}

		await loadBundle("fv_3d.bundle.js");

		const three = frappe.visual?.three;

		if (!three?.ThreeEngine || !three?.HospitalityOverlay || !three?.THREE) {
			throw new Error(
				"Frappe Visual 3D components could not be loaded."
			);
		}

		this._loaded = true;
	},

	normalizeStatus(status) {
		const value = (status || "Available").trim().toLowerCase();

		const map = {
			available: "available",
			occupied: "occupied",
			reserved: "reserved",
			blocked: "maintenance",
			"out of order": "maintenance",
			"out of service": "maintenance",
		};

		return map[value] || "available";
	},

	getStatusColor(status) {
		const colors = {
			available: 0x22c55e,
			occupied: 0xef4444,
			reserved: 0x3b82f6,
			maintenance: 0x6b7280,
		};

		return colors[this.normalizeStatus(status)];
	},

	async getRooms(opts = {}) {
		if (!opts.property) {
			throw new Error("Select a property before loading rooms.");
		}

		const filters = {
			property: opts.property,
		};

		if (opts.floor) {
			filters.floor = opts.floor;
		}

		const response = await frappe.call({
			method: "frappe.client.get_list",
			args: {
				doctype: "VL Room",
				filters,
				fields: [
					"name",
					"room_number",
					"room_name",
					"room_type",
					"property",
					"floor",
					"room_status",
					"current_guest",
					"current_reservation",
					"current_folio",
				],
				limit_page_length: 0,
			},
		});

		return response.message || [];
	},

	createRoomMesh(THREE, engine, room, index) {
		const status = this.normalizeStatus(room.room_status);
		const columnCount = 5;
		const spacing = 3.2;
		const column = index % columnCount;
		const row = Math.floor(index / columnCount);

		const geometry = new THREE.BoxGeometry(2.4, 0.8, 2.4);
		const material = new THREE.MeshStandardMaterial({
			color: this.getStatusColor(status),
			roughness: 0.65,
			metalness: 0.05,
		});

		const mesh = new THREE.Mesh(geometry, material);

		mesh.name = room.room_number || room.name;
		mesh.position.set(
			column * spacing,
			0.4,
			row * spacing
		);

		mesh.userData.velaraRoomName = room.name;
		mesh.userData.velaraRoomNumber = room.room_number;
		mesh.userData.velaraRoomStatus = status;

		engine.scene.add(mesh);

		// Display the room number above its 3D block.
		const canvas = document.createElement("canvas");
		canvas.width = 256;
		canvas.height = 96;

		const context = canvas.getContext("2d");

		if (context) {
			context.fillStyle = "#ffffff";
			context.fillRect(0, 0, canvas.width, canvas.height);

			context.fillStyle = "#172033";
			context.font = "bold 36px Arial";
			context.textAlign = "center";
			context.textBaseline = "middle";
			context.fillText(
				String(room.room_number || room.name),
				128,
				48
			);

			const texture = new THREE.CanvasTexture(canvas);
			const labelMaterial = new THREE.SpriteMaterial({
				map: texture,
				transparent: false,
				depthTest: false,
			});

			const label = new THREE.Sprite(labelMaterial);
			label.position.set(
				mesh.position.x,
				mesh.position.y + 1.0,
				mesh.position.z
			);
			label.scale.set(2.4, 0.9, 1);
			label.renderOrder = 10;
			engine.scene.add(label);
			mesh.userData.velaraLabel = label;
		}

		return mesh;
	},

	bindRoomClicks(engine, roomByName) {
		const THREE = frappe.visual.three.THREE;
		const canvas = engine.renderer?.domElement;

		if (!canvas || !engine.camera) {
			console.warn("Velara 3D: click handling is unavailable.");
			return;
		}

		const raycaster = new THREE.Raycaster();
		const pointer = new THREE.Vector2();

		canvas.style.cursor = "pointer";

		canvas.addEventListener("click", (event) => {
			const rect = canvas.getBoundingClientRect();

			pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
			pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

			raycaster.setFromCamera(pointer, engine.camera);

			const meshes = [];

			engine.scene.traverse((object) => {
				if (object.userData?.velaraRoomName) {
					meshes.push(object);
				}
			});

			const hits = raycaster.intersectObjects(meshes, false);

			if (!hits.length) return;

			const roomName = hits[0].object.userData.velaraRoomName;

			if (roomByName.has(roomName)) {
				frappe.set_route("Form", "VL Room", roomName);
			}
		});
	},

	async create(container, opts = {}) {
		await this.load();

		const el = typeof container === "string"
			? document.querySelector(container)
			: container;

		if (!el) {
			throw new Error("The 3D viewer container was not found.");
		}

		if (!opts.property) {
			throw new Error("Select a property before opening the floor plan.");
		}

		el.innerHTML = "";
		el.style.minHeight = "420px";
		el.style.position = "relative";

		const three = frappe.visual.three;
		const THREE = three.THREE;

		const engine = new three.ThreeEngine({
			container: el,
			background: opts.background || "#f4f6f9",
			shadows: true,
			antialias: true,
		});

		// HospitalityOverlay expects THREE on the engine instance.
		engine.THREE = THREE;

		const overlay = new three.HospitalityOverlay(engine, {
			statusColors: {
				available: 0x22c55e,
				occupied: 0xef4444,
				reserved: 0x3b82f6,
				maintenance: 0x6b7280,
			},
		});

		const rooms = await this.getRooms(opts);
		const roomByName = new Map();
		const units = [];

		rooms.forEach((room, index) => {
			const mesh = this.createRoomMesh(
				THREE,
				engine,
				room,
				index
			);

			roomByName.set(room.name, room);

			units.push({
				name: room.name,
				type: "room",
				meshName: mesh.name,
				status: this.normalizeStatus(room.room_status),
				metadata: {
					room_number: room.room_number,
					room_type: room.room_type,
					room_status: room.room_status,
					property: room.property,
					floor: room.floor,
					guest: room.current_guest,
					reservation: room.current_reservation,
					folio: room.current_folio,
				},
			});
		});

		overlay.registerUnits(units);

		this.bindRoomClicks(engine, roomByName);

		return {
			engine,
			overlay,
			rooms,
			roomByName,
		};
	},

	async createDashboard(container, opts = {}) {
		const el = typeof container === "string"
			? document.querySelector(container)
			: container;

		if (!el) {
			throw new Error("The dashboard container was not found.");
		}

		el.innerHTML = `
			<div class="vl-floor-dashboard"
				style="display:grid;grid-template-columns:minmax(0,3fr) minmax(190px,1fr);gap:16px;min-height:440px;">
				<div class="vl-floor-viewer"
					style="min-width:0;min-height:440px;overflow:hidden;border:1px solid var(--border-color);border-radius:12px;">
				</div>
				<div class="vl-floor-stats"
					style="padding:16px;background:var(--card-bg);border:1px solid var(--border-color);border-radius:12px;">
					<h4>${__("Room Status")}</h4>
					<div class="vl-stats-content">${__("Loading...")}</div>
				</div>
			</div>
		`;

		const viewer = el.querySelector(".vl-floor-viewer");
		const stats = el.querySelector(".vl-stats-content");

		try {
			const result = await this.create(viewer, opts);
			const rooms = result.rooms;

			const counts = {
				available: 0,
				occupied: 0,
				reserved: 0,
				maintenance: 0,
			};

			rooms.forEach((room) => {
				counts[this.normalizeStatus(room.room_status)]++;
			});

			const total = rooms.length;
			const occupancyRate = total
				? Math.round((counts.occupied / total) * 100)
				: 0;

			const labels = {
				available: __("Available"),
				occupied: __("Occupied"),
				reserved: __("Reserved"),
				maintenance: __("Blocked / Maintenance"),
			};

			const colors = {
				available: "#22c55e",
				occupied: "#ef4444",
				reserved: "#3b82f6",
				maintenance: "#6b7280",
			};

			let html = `
				<div style="margin-bottom:16px;">
					<div class="text-muted">${__("Total Rooms")}</div>
					<div style="font-size:28px;font-weight:700;">${total}</div>
				</div>
				<div style="margin-bottom:16px;">
					<div class="text-muted">${__("Occupancy Rate")}</div>
					<div style="font-size:24px;font-weight:700;">${occupancyRate}%</div>
				</div>
				<hr>
			`;

			Object.keys(labels).forEach((status) => {
				html += `
					<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:12px 0;">
						<span>
							<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${colors[status]};margin-inline-end:6px;"></span>
							${labels[status]}
						</span>
						<strong>${counts[status]}</strong>
					</div>
				`;
			});

			stats.innerHTML = html;

			return result;
		} catch (error) {
			console.error("Velara 3D dashboard error:", error);

			stats.textContent = __(
				"Could not load the floor plan. Check browser console and permissions."
			);

			frappe.msgprint({
				title: __("3D Floor Plan Error"),
				message: error.message || __("An unexpected error occurred."),
				indicator: "red",
			});

			return null;
		}
	},

	addFormButton(frm) {
		frm.add_custom_button(
			__("3D Floor Plan"),
			async () => {
				if (!frm.doc.property) {
					frappe.msgprint(
						__("Select a property before opening the floor plan.")
					);
					return;
				}

				const dialog = new frappe.ui.Dialog({
					title: __("Hotel Floor Plan"),
					size: "extra-large",
				});

				dialog.$body.css({
					minHeight: "500px",
				});

				dialog.show();

				try {
					await this.createDashboard(dialog.body, {
						property: frm.doc.property,
						floor: frm.doc.floor,
					});
				} catch (error) {
					console.error(error);
					frappe.msgprint({
						title: __("3D Floor Plan Error"),
						message: error.message || __("Could not open the floor plan."),
						indicator: "red",
					});
				}
			},
			__("View")
		);
	},
};
