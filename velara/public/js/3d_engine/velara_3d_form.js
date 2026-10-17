frappe.ui.form.on("VL Room", {
    refresh(frm) {
        if (frm.is_new()) {
            return;
        }

        if (frappe.velara?.floorPlan?.addFormButton) {
            frappe.velara.floorPlan.addFormButton(frm);
        } else {
            console.error(
                "Velara 3D Floor Plan: addFormButton is not available."
            );
        }
    },
});
