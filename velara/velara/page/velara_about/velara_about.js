
frappe.pages["velara-about"].on_page_load = function(wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: __("About Velara"),
        single_column: true,
    });

    page.main.addClass("velara-about-page");

    const features = [
        ["door-enter", "Front Desk", "Check-in/out, room assignment, guest profiles, and live room rack."],
        ["bed", "Room Management", "Room types, inventory, housekeeping status, and maintenance tracking."],
        ["calendar-event", "Reservations", "Bookings, availability calendar, and rate management."],
        ["broom", "Housekeeping", "Room cleaning, assignments, inspections, and status tracking."],
        ["tools-kitchen-2", "Food & Beverage", "Restaurant, room service, minibar, and banquet management."],
        ["spa", "Spa & Wellness", "Treatment bookings, therapist scheduling, and package management."],
        ["calendar-stats", "Events", "Event bookings, setup requirements, and billing."],
        ["report-money", "Revenue & Night Audit", "Rate management, revenue tracking, and financial reports."]
    ];

    const $container = $('<div class="velara-about-content"></div>').appendTo(page.main);

    $container.html(`
        <div style="max-width:1100px;margin:32px auto;padding:24px;">
            <div style="text-align:center;padding:36px 16px;background:linear-gradient(135deg,#8B5CF6,#6D28D9);color:white;border-radius:16px;">
                <h1 style="font-size:36px;font-weight:800;color:white;margin:0 0 12px;">Velara</h1>
                <p style="font-size:16px;margin:0 auto;max-width:650px;">
                    ${__("Hotel and Hospitality Management System")}
                </p>
            </div>

            <h2 style="margin:32px 0 16px;">${__("Features")}</h2>
            <div class="row">
                ${features.map((item) => `
                    <div class="col-md-6 col-lg-4" style="margin-bottom:16px;">
                        <div style="height:100%;padding:20px;border:1px solid var(--border-color);border-radius:12px;">
                            <h3 style="font-size:17px;margin-top:0;">${__(item[1])}</h3>
                            <p style="color:var(--text-muted);margin-bottom:0;">${__(item[2])}</p>
                        </div>
                    </div>
                `).join("")}
            </div>

            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:28px 0;">
                <a href="/app/velara-onboarding" class="btn btn-primary btn-lg">
                    ${__("Start Onboarding")}
                </a>
                <a href="/app/vl-settings" class="btn btn-default btn-lg">
                    ${__("Open Settings")}
                </a>
                <a href="/app/vl-reservation" class="btn btn-default btn-lg">
                    ${__("Reservations")}
                </a>
            </div>
        </div>
    `);
};
