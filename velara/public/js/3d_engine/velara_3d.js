
 // Copyright (c) 2024, Moataz M Hassan (Arkan Lab)
 // License: GPL-3.0

/**
 * Velara 3D Hotel Integration
 * Integrates frappe_visual's 3D framework with Velara room management.
 *
 * Lazy-loaded via frappe.require() — NOT included in app_include_js.
 *
 * Usage:
 *   await frappe.velara.floorPlan.create("#container", {
 *       property: "PROP-001",
 *       floor: "FLOOR-001"
 *   });
 */

frappe.provide("frappe.velara.floorPlan");

frappe.velara.floorPlan = {
	_loaded: false,

	async load() {
		if (this._loaded) return;

		if (!frappe.visual || typeof frappe.visual.load3D !== "function") {
			throw new Error(
				"frappe_visual 3D framework is not available or not loaded."
			);
		}

		await frappe.visual.load3D();
		this._loaded = true;
	},

	/**
	 * Normalize VL Room status values for the 3D overlay.
	 */
	normalizeStatus(status) {
		const value = (status || "Available").trim().toLowerCase();

		const statusMap = {
			available: "available",
			occupied: "occupied",
			reserved: "reserved",
			blocked: "maintenance",
			"out of order": "maintenance",
			"out of service": "maintenance",
		};

		return statusMap[value] || "available";
	},

	/**
	 * Create a 3D floor plan viewer with real-time room status.
	 *
	 * @param {string|Element} container
	 * @param {Object} opts — { property, floor, modelUrl, background }
	 */
	async create(container, opts = {}) {
		await this.load();

		const el =
			typeof container === "string"
				? document.querySelector(container)
				: container;

		if (!el) {
			console.warn("Velara 3D: container not found.");
			return null;
		}

		const { ThreeEngine, HospitalityOverlay } = frappe.visual.three || {};

		if (!ThreeEngine || !HospitalityOverlay) {
			throw new Error(
				"ThreeEngine or HospitalityOverlay is unavailable in frappe_visual."
			);
		}

		const engine = new ThreeEngine(el, {
			background: opts.background || "#faf9f6",
			shadows: true,
			antialias: true,
		});

		engine.init();

		const overlay = new HospitalityOverlay(engine, {
			statusColors: {
				available: 0x22c55e,
				occupied: 0xef4444,
				reserved: 0x3b82f6,
				maintenance: 0x6b7280,
			},
		});

		// Load the 3D model only when a model URL is supplied.
		if (opts.modelUrl) {
			const { ModelLoader } = frappe.visual.three;

			if (ModelLoader) {
				const loader = new ModelLoader(engine);

				try {
					const model = await loader.load(opts.modelUrl);
					engine.scene.add(model);
				} catch (error) {
					console.error(
						"Velara 3D: failed to load floor plan model.",
						error
					);
				}
			} else {
				console.warn("Velara 3D: ModelLoader is unavailable.");
			}
		}

		// Load rooms using the actual VL Room fields.
		if (opts.property) {
			try {
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

				const rooms = response.message || [];

				const units = rooms.map((room) => ({
					id: room.name,
					meshName: room.room_number,
					status: this.normalizeStatus(room.room_status),
					label: `${room.room_number} — ${
						__(room.room_type || "Room")
					}`,
					metadata: {
						room_number: room.room_number,
						room_name: room.room_name,
						room_type: room.room_type,
						room_status: room.room_status,
						property: room.property,
						floor: room.floor,
						guest: room.current_guest,
						reservation: room.current_reservation,
						folio: room.current_folio,
					},
				}));

				overlay.registerUnits(units);
			} catch (error) {
				console.error(
					"Velara 3D: could not load VL Room data.",
					error
				);

				frappe.msgprint({
					title: __("Room Data Error"),
					message: __(
						"Could not load room data. Check the property, permissions, and 3D framework."
					),
					indicator: "red",
				});
			}
		} else {
			console.info(
				"Velara 3D: no property supplied; room data was not loaded."
			);
		}

		// Clicking a registered room opens its VL Room form.
		overlay.onUnitClick = (unitData) => {
			if (!unitData || !unitData.id) return;

			frappe.set_route("Form", "VL Room", unitData.id);
		};

		return {
			engine,
			overlay,
		};
	},

	/**
	 * Create a dashboard with the 3D floor plan and room statistics.
	 */
	async createDashboard(container, opts = {}) {
		const el =
			typeof container === "string"
				? document.querySelector(container)
				: container;

		if (!el) return null;

		el.innerHTML = `
			<div class="vl-floor-dashboard"
				style="display:flex;gap:16px;height:500px;min-height:400px;">
				<div class="vl-floor-viewer"
					style="flex:3;min-width:0;border-radius:12px;overflow:hidden;border:1px solid var(--border-color);">
				</div>
				<div class="vl-floor-stats"
					style="flex:1;min-width:180px;padding:16px;border-radius:12px;overflow-y:auto;background:var(--card-bg);border:1px solid var(--border-color);">
					<h4>${__("Room Status")}</h4>
					<div class="vl-stats-content">
						${__("Loading room statistics...")}
					</div>
				</div>
			</div>
		`;

		const viewerEl = el.querySelector(".vl-floor-viewer");
		const statsEl = el.querySelector(".vl-stats-content");

		try {
			const result = await this.create(viewerEl, opts);

			if (!result) return null;

			const summary = result.overlay.getOccupancySummary();

			const statusLabels = {
				available: {
					label: __("Available"),
					color: "#22c55e",
				},
				occupied: {
					label: __("Occupied"),
					color: "#ef4444",
				},
				reserved: {
					label: __("Reserved"),
					color: "#3b82f6",
				},
				maintenance: {
					label: __("Blocked / Maintenance"),
					color: "#6b7280",
				},
			};

			const total = summary.total || 0;
			const occupancyRate =
				summary.occupancyRate ??
				(total
					? Math.round(
							((summary.byStatus?.occupied || 0) / total) * 100
						)
					: 0);

			let statsHTML = `
				<div style="margin-bottom:12px;">
					<div class="text-muted">${__("Total Rooms")}</div>
					<div style="font-size:2em;font-weight:bold;color:var(--primary);">
						${total}
					</div>
				</div>

				<div style="margin-bottom:12px;">
					<div class="text-muted">${__("Occupancy Rate")}</div>
					<div style="font-size:1.5em;font-weight:bold;">
						${occupancyRate}%
					</div>
				</div>
				<hr>
			`;

			for (const [status, info] of Object.entries(statusLabels)) {
				const count = summary.byStatus?.[status] || 0;

				statsHTML += `
					<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
						<span style="display:flex;align-items:center;gap:6px;">
							<span style="width:10px;height:10px;border-radius:50%;background:${info.color};display:inline-block;"></span>
							${info.label}
						</span>
						<strong>${count}</strong>
					</div>
				`;
			}

			statsEl.innerHTML = statsHTML;

			return result;
		} catch (error) {
			console.error("Velara 3D dashboard error:", error);

			statsEl.textContent = __(
				"Unable to display the 3D floor plan. Check the browser console and framework availability."
			);

			return null;
		}
	},

	/**
	 * Add a 3D Floor Plan button to the VL Room form.
	 */
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
					title: __("Hotel Floor Plan — {0}", [
						frm.doc.property,
					]),
					size: "extra-large",
				});

				dialog.$body.css({
					height: "600px",
					minHeight: "400px",
				});

				dialog.show();

				await frappe.velara.floorPlan.create(dialog.body, {
					property: frm.doc.property,
					floor: frm.doc.floor,
				});
			},
			__("View")
		);
	},
};
