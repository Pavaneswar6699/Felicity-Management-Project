const ics = require('ics');

const generateICS = (event, organizerName) => {
    return new Promise((resolve, reject) => {
        const startDate = new Date(event.start);
        const start = [
            startDate.getFullYear(),
            startDate.getMonth() + 1,
            startDate.getDate(),
            startDate.getHours(),
            startDate.getMinutes()
        ];

        let end;
        if (event.end) {
            const endDate = new Date(event.end);
            end = [
                endDate.getFullYear(),
                endDate.getMonth() + 1,
                endDate.getDate(),
                endDate.getHours(),
                endDate.getMinutes()
            ];
        } else {
            end = [
                startDate.getFullYear(),
                startDate.getMonth() + 1,
                startDate.getDate(),
                startDate.getHours() + 1,
                startDate.getMinutes()
            ];
        }

        const icsEvent = {
            start: start,
            end: end,
            title: event.name,
            description: event.description || '',
            location: 'IIIT Hyderabad',
            organizer: { name: organizerName || 'Event Organizer' }
        };

        ics.createEvent(icsEvent, (error, value) => {
            if (error) {
                return reject(error);
            }
            resolve(value);
        });
    });
};

module.exports = { generateICS };
