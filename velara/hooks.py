app_name = "velara"
app_title = "Velara"
app_publisher = "Arkan Lab"
app_description = "Hotel & Hospitality Management System"
app_email = "dev@arkan.tech"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_js = "/assets/velara/js/velara.js"
# app_include_css = "/assets/velara/css/velara.css"

# include js, css files in header of web template
# web_include_js = "/assets/velara/js/velara.js"
# web_include_css = "/assets/velara/css/velara.css"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "velara/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/page.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by role)
# role_home_page = {
#	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = "Web Page"

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
#	"methods": "velara.utils.jinja_methods",
#	"filters": "velara.utils.jinja_methods"
# }

# Installation
# ------------

# before_install = "velara.install.before_install"
# after_install = "velara.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "velara.uninstall.before_uninstall"
# after_uninstall = "velara.uninstall.after_uninstall"

# Integration Setup
# ------------------
# to set up dependencies/integrations before other apps are installed
# before_install_dependencies = []

# Desk Notifications
# ------------------
# See frappe.desk.notifications.get_notification_config

# notification_config = "velara.notifications.get_notification_config"

# Permissions
# -----------
# Data permissions set in the custom app folder

# permission_query_conditions = {
#	"Event": "velara.query_conditions.get_permission_query_conditions"
# }

# has_permission = {
#	"Event": "velara.has_permission.get_permission_query_conditions"
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_whitelisted_methods = {
#	"frappe.desk.notifications.get_notification_config": "velara.notifications.get_notification_config"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
#	"*": {
#	    "On_click_load_text": "velara.events.on_click"
#	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
#	"all": [
#	    "velara.tasks.all"
#	],
#	"daily": [
#	    "velara.tasks.daily"
#	],
#	"hourly": [
#	    "velara.tasks.hourly"
#	],
#	"weekly": [
#	    "velara.tasks.weekly"
#	],
#	"monthly": [
#	    "velara.tasks.monthly"
#	],
# }

# Testing
# -------

# before_migrate = "velara.patches.execute"

# Overriding Methods
# ------------------
# وكما أكدنا سابقاً، هذا الملف سليم تماماً ولا تحتاج لتعديل أي شيء بداخله؛ التركيز فقط يجب أن يكون على وضع ملفي `setup.py` و `pyproject.toml` في الجذر الرئيسي للمستودع.
