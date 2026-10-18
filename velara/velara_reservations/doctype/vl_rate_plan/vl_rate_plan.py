
# Copyright (c) 2024, Moataz M Hassan (Arkan Lab)
# Developer Website: https://arkan.it.com
# License: MIT
# For license information, please see license.txt

"""VL Rate Plan — Rate Plan / Pricing Controller"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt


class VLRatePlan(Document):
    def validate(self):
        rate_type = self.get("base_rate_type")

        if rate_type == "Fixed Amount":
            if flt(self.get("fixed_rate")) <= 0:
                frappe.throw(_("Fixed Rate must be greater than zero"))

        elif rate_type == "Multiplier":
            if flt(self.get("multiplier")) <= 0:
                frappe.throw(_("Multiplier must be greater than zero"))

        if hasattr(self, "min_rate") and hasattr(self, "max_rate"):
            if flt(self.min_rate) > 0 and flt(self.max_rate) > 0:
                if flt(self.min_rate) > flt(self.max_rate):
                    frappe.throw(
                        _("Minimum Rate cannot exceed Maximum Rate")
                    )
