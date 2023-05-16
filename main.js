var days = [];
var daySelectorString =
    ".css-26l3qy-menu .css-7y1yff-option, .css-26l3qy-menu .css-190du8y-option, .css-26l3qy-menu .css-14lom8e-option";

var users = [];
var userSelectorString =
    ".css-26l3qy-menu .css-7y1yff-option, .css-26l3qy-menu .css-190du8y-option, .css-26l3qy-menu .css-14lom8e-option";

var engine_pricing = {
    "gpt-4-0314": {
        prompt: 0.03,
        generated: 0.06,
    },
    "gpt-3.5-turbo-0301": {
        prompt: 0.002,
        generated: 0.002,
    },
};

async function selectDay(dayIndex) {
    const daySelect = document.querySelector(
        ".usage-day-select .css-i4h7a8-control"
    );
    const dayDropdownIndicator = daySelect.querySelector(
        ".select-dropdown-indicator"
    );

    // Trigger click to show user options
    dayDropdownIndicator.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
    );
    await new Promise((r) => setTimeout(r, 500));

    Array.from(document.querySelectorAll(daySelectorString))[dayIndex].click();

    // Wait for the day to be selected
    await new Promise((r) => setTimeout(r, 500));

    return true;
}

async function selectUser(userIndex) {
    const userSelect = document.querySelector(
        ".usage-org-member-select .css-i4h7a8-control"
    );
    const userDropdownIndicator = userSelect.querySelector(
        ".select-dropdown-indicator"
    );

    // Trigger click to show user options
    userDropdownIndicator.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
    );
    await new Promise((r) => setTimeout(r, 1500));

    try {
        Array.from(document.querySelectorAll(userSelectorString))[
            userIndex
        ].click();
    } catch (error) {
        console.log("User not found");
        return false;
    }

    // Wait for the user to be selected
    await new Promise((r) => setTimeout(r, 1500));

    return true;
}

async function expandAllUsageAccordions() {
    try {
        await new Promise((r) => setTimeout(r, 1500));
        document.querySelector(".expn-icon").click();
        await new Promise((r) => setTimeout(r, 500));

        // Click on element with class starting with "expander-"
        const expander = document.querySelector("[id^='expander-']");

        // Get all expn-icon elements which are children of expander
        const expanders = Array.from(expander.querySelectorAll(".expn-icon"));
        for (let expander of expanders) {
            expander.click();
            await new Promise((r) => setTimeout(r, 500));
        }
    } catch (error) {
        // Handle the error appropriately
        console.error(error);
    }
}

// The object from getMonthlyUsage() is passed in as totalTokensPerUser
// This is per user per engine
// For each user calculate the prompt, generated, and total tokens per engine
async function addTotalOfMonthPerUser(totalTokensPerUser) {
    var types = ["prompt", "generated", "sum"];
    for (let user in totalTokensPerUser) {
        totalTokensPerUser[user]["Total"] = {};
        for (let day in totalTokensPerUser[user]) {
            if (day !== "Total") {
                for (let timestamp in totalTokensPerUser[user][day]) {
                    for (let engine in totalTokensPerUser[user][day][
                        timestamp
                    ]) {
                        // Continue if engine is in types
                        if (types.includes(engine)) {
                            continue;
                        }

                        const engine_name =
                            totalTokensPerUser[user][day][timestamp][engine];
                        console.log(engine_name);

                        if (!totalTokensPerUser[user]["Total"][engine_name]) {
                            totalTokensPerUser[user]["Total"][engine_name] = {};
                        }

                        for (let type of types) {
                            if (
                                totalTokensPerUser[user]["Total"][engine_name][
                                    type
                                ]
                            ) {
                                totalTokensPerUser[user]["Total"][engine_name][
                                    type
                                ] +=
                                    totalTokensPerUser[user][day][timestamp][
                                        type
                                    ];
                            } else {
                                totalTokensPerUser[user]["Total"][engine_name][
                                    type
                                ] =
                                    totalTokensPerUser[user][day][timestamp][
                                        type
                                    ];
                            }
                        }
                    }
                }
            }
        }
    }

    return totalTokensPerUser;
}

// The object from addTotalOfMonthPerUser() is passed in as totalTokensPerUser
// This is per user per engine per type
async function addTotalOfAllUsers(totalTokensPerUser) {
    var types = ["prompt", "generated", "sum"];
    for (let user in totalTokensPerUser) {
        if (user === "Total") {
            continue;
        }

        if (!("Total" in totalTokensPerUser[user])) {
            continue;
        }
        console.log(totalTokensPerUser[user]["Total"]);

        for (let engine in totalTokensPerUser[user]["Total"]) {
            if (!(engine in totalTokensPerUser[user]["Total"])) {
                totalTokensPerUser["Total"][engine] = {};
            }

            if (!("Total" in totalTokensPerUser)) {
                totalTokensPerUser["Total"] = {};
            }

            if (!(engine in totalTokensPerUser["Total"])) {
                totalTokensPerUser["Total"][engine] = {};
            }

            for (let type of types) {
                if (!(type in totalTokensPerUser["Total"][engine])) {
                    totalTokensPerUser["Total"][engine][type] = 0;
                }

                if (type in totalTokensPerUser[user]["Total"][engine]) {
                    totalTokensPerUser["Total"][engine][type] +=
                        totalTokensPerUser[user]["Total"][engine][type];
                } else {
                    totalTokensPerUser["Total"][engine][type] =
                        totalTokensPerUser[user]["Total"][engine][type];
                }
            }
        }
    }

    return totalTokensPerUser;
}

// Get from the element with data-testid="monthly-used" the price
// Remove the dollar sign and return the price as a number
async function getMonthlyPrice() {
    const monthlyPrice = document.querySelector(
        "[data-testid='monthly-used']"
    ).textContent;

    return Number(monthlyPrice.replace("$", ""));
}

// The object from addTotalOfAllUsers() is passed in as totalTokensPerUser
// This is per user per engine
async function percentagePerUser(totalTokensPerUser) {
    let total = totalTokensPerUser["Total"];
    for (let user in totalTokensPerUser) {
        for (let engine in totalTokensPerUser[user]["Total"]) {
            var percentage =
                (totalTokensPerUser[user]["Total"][engine] / total[engine]) *
                100;
            // Round to 2 decimals normally
            percentage = Math.round(percentage * 100) / 100;
            totalTokensPerUser[user]["Total"][engine]["percentage"] =
                percentage;
        }
    }

    return totalTokensPerUser;
}

// Add the price per user per engine
// Using the percentage per user
async function addPricePerUser() {
    for (let user in totalTokensPerUser) {
        for (let engine in totalTokensPerUser[user]["Total"]) {
            var price =
                (totalTokensPerUser[user]["Total"][engine]["percentage"] /
                    100) *
                monthlyPrice;
            // Round to 2 decimals normally
            price = Math.round(price * 100) / 100;
            totalTokensPerUser[user]["Total"][engine]["price"] = price;
        }
    }

    return totalTokensPerUser;
}

async function addUsersToTotalTokensObject(users) {
    var totalTokensPerUser = {};
    for (j = 0; j < users.length; j++) {
        selectUser(j);
        console.log("This is user:");
        // Get the first child text of user
        var userText = users[j].firstChild.textContent;

        // Create an object for the user
        totalTokensPerUser[userText] = {};
    }

    return totalTokensPerUser;
}

// This is per user per engine per type
// Based on the engine_pricing object:
// {
//     "gpt-4-0314": {
//         prompt: 0.03,
//         generated: 0.06,
//     },
//     "gpt-3.5-turbo-0301": {
//         prompt: 0.002,
//         generated: 0.002,
//     },
// };
// Create a different entry for the pricing of the sum of prompt and generated
// in the totalTokensPerUser object
// This is per user per engine per type
// {
//    "User 1": {
//      "Pricing" : {
//          "gpt-4-0314": {
//              prompt: 2.00,
//              generated: 4.00,
//              sum: 6.00
//          },
//          "gpt-3.5-turbo-0301": {
//              prompt: 0.20,
//              generated: 0.20,
//              sum: 0.40
//          },
//      "Total": {
//          "prompt": 2.20,
//          "generated": 4.20,
//          "sum": 6.40
//      }
//    }
// }
async function calculatePricingBasedOnTotalUsage(totalTokensPerUser) {
    var types = ["prompt", "generated", "sum"];
    for (let user in totalTokensPerUser) {
        if (user === "Total") {
            continue;
        }

        for (let engine in totalTokensPerUser[user]["Total"]) {
            if (!(engine in engine_pricing)) {
                continue;
            }

            for (let type of types) {
                if (!(type in engine_pricing[engine])) {
                    continue;
                }

                var price =
                    (totalTokensPerUser[user]["Total"][engine][type] / 1000) *
                    engine_pricing[engine][type];

                // Round to 2 decimals normally
                price = Math.round(price * 100) / 100;

                if (!("Pricing" in totalTokensPerUser[user])) {
                    totalTokensPerUser[user]["Pricing"] = {};
                }

                if (!(engine in totalTokensPerUser[user]["Pricing"])) {
                    totalTokensPerUser[user]["Pricing"][engine] = {};
                }

                totalTokensPerUser[user]["Pricing"][engine][type] = price;

                // Add a sum of prompt and generated
                if (!("sum" in totalTokensPerUser[user]["Pricing"][engine])) {
                    totalTokensPerUser[user]["Pricing"][engine]["sum"] = 0;
                }
                totalTokensPerUser[user]["Pricing"][engine]["sum"] += price;
            }
        }

        if (!("Pricing" in totalTokensPerUser[user])) {
            totalTokensPerUser[user]["Pricing"] = {};
        }

        // Add a sum to the total of all engines
        // Check if Total exists
        if (!("Total" in totalTokensPerUser[user]["Pricing"])) {
            totalTokensPerUser[user]["Pricing"]["Total"] = {};
        }

        // Add the sum of all engines
        for (let type of types) {
            console.log(type);
            if (!(type in totalTokensPerUser[user]["Pricing"]["Total"])) {
                totalTokensPerUser[user]["Pricing"]["Total"][type] = 0;
            }

            for (let engine in totalTokensPerUser[user]["Pricing"]) {
                if (engine === "Total") {
                    continue;
                }

                totalTokensPerUser[user]["Pricing"]["Total"][type] +=
                    totalTokensPerUser[user]["Pricing"][engine][type];
            }
        }

        // Add a total to the total of all users
        // Check if Pricing exists
        if (!("Pricing" in totalTokensPerUser)) {
            totalTokensPerUser["Pricing"] = {};
        }

        // Check if Total exists
        if (!("Total" in totalTokensPerUser["Pricing"])) {
            totalTokensPerUser["Pricing"]["Total"] = 0;
        }

        // Add the current user to the total
        // Use the just calculated sum
        totalTokensPerUser["Pricing"]["Total"] +=
            totalTokensPerUser[user]["Pricing"]["Total"]["sum"];
    }

    return totalTokensPerUser;
}

async function getMonthlyUsage() {
    const userSelect = document.querySelector(
        ".usage-org-member-select .css-i4h7a8-control"
    );
    const userDropdownIndicator = userSelect.querySelector(
        ".select-dropdown-indicator"
    );
    const daySelect = document.querySelector(
        ".usage-day-select .css-i4h7a8-control"
    );
    const dayDropdownIndicator = daySelect.querySelector(
        ".select-dropdown-indicator"
    );

    // Trigger click to show user options
    userDropdownIndicator.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
    );
    await new Promise((r) => setTimeout(r, 1500));

    const users = Array.from(document.querySelectorAll(userSelectorString));
    var totalTokensPerUser = await addUsersToTotalTokensObject(users);

    // Close user options
    userDropdownIndicator.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
    );
    await new Promise((r) => setTimeout(r, 1500));

    // Trigger click to show user options
    dayDropdownIndicator.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
    );
    await new Promise((r) => setTimeout(r, 500));

    var days = Array.from(document.querySelectorAll(daySelectorString));

    // Close user options
    dayDropdownIndicator.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true })
    );
    await new Promise((r) => setTimeout(r, 500));

    for (i = 0; i < days.length; i++) {
        let totalTokens = 0;
        console.log(i);

        selectDay(i);

        // Timeout of 2 seconds to wait for the page to load
        await new Promise((r) => setTimeout(r, 2000));

        console.log("This is day:");
        // Get the first child text of day
        var dayText = days[i].firstChild.textContent;
        console.log(dayText);

        for (j = 0; j < users.length; j++) {
            selectUser(j);
            console.log("This is user:");
            // Get the first child text of user
            var userText = users[j].firstChild.textContent;
            console.log(userText);
            // Timeout of 2 seconds to wait for the page to load
            await new Promise((r) => setTimeout(r, 2000));

            await expandAllUsageAccordions();

            // Get the usage for each usage-row class
            const usage_rows = document.querySelectorAll(".usage-row");

            // For each usage-row class, get the sum class and the num-requests class
            for (let usage_row of usage_rows) {
                const sum = usage_row.querySelector(".sum");
                const prompt = usage_row.querySelector(".prompt");
                const generated = usage_row.querySelector(".generated");
                const num_requests = usage_row.querySelector(".num-requests");
                const timestamp = usage_row.querySelector(".usage-date");

                // num-requests contains the inner text 'gpt-3.5-turbo-0301, 2 requests', only the first part is needed
                const num_requests_text = num_requests.innerText.split(",")[0];

                // sum needs to be parsed like: parseInt(el.innerText.replace(/,/g, ""), 10);
                const sum_text = parseInt(sum.innerText.replace(/,/g, ""), 10);

                // prompt needs to be parsed like: parseInt(el.innerText.replace(/,/g, ""), 10);
                const prompt_text = parseInt(
                    prompt.innerText.replace(/,/g, ""),
                    10
                );

                // generated needs to be parsed like: parseInt(el.innerText.replace(/,/g, ""), 10);
                const generated_text = parseInt(
                    generated.innerText.replace(/,/g, ""),
                    10
                );

                // timestamp just needs the inner text
                const timestamp_text = timestamp.innerText;

                console.log("This is timestamp:");
                console.log(timestamp_text);

                console.log(totalTokensPerUser);
                // Add the sum to the totalTokensPerUser object
                totalTokensPerUser[userText] = {
                    ...totalTokensPerUser[userText],
                    [dayText]: {
                        ...totalTokensPerUser[userText][dayText],
                        [timestamp_text]: {
                            sum: sum_text,
                            engine: num_requests_text,
                            prompt: prompt_text,
                            generated: generated_text,
                        },
                    },
                };
            }
        }
    }

    // Add total of all days per user
    totalTokensPerUser = await addTotalOfMonthPerUser(totalTokensPerUser);

    // Add total of all users
    totalTokensPerUser = await addTotalOfAllUsers(totalTokensPerUser);

    // Add percentage of total per user
    totalTokensPerUser = await percentagePerUser(totalTokensPerUser);

    totalTokensPerUser = await calculatePricingBasedOnTotalUsage(
        totalTokensPerUser
    );
    console.log(totalTokensPerUser);
    return totalTokensPerUser;
}

getMonthlyUsage();
