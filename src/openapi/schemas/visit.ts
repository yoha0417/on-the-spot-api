export const visitWithPlaceSchema = {
	type: "object",
	properties: {
		visitId: { type: "string" },
		checkedInAt: { type: "string", format: "date-time" },
		checkedOutAt: { type: "string", format: "date-time", nullable: true },
		status: { type: "string", enum: ["active", "checked_out"] },
		durationMinutes: { type: "number" },
		place: {
			type: "object",
			properties: {
				id: { type: "string" },
				name: { type: "string" },
				latitude: { type: "number" },
				longitude: { type: "number" },
				address: { type: "string", nullable: true },
			},
		},
	},
};
