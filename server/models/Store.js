const mongoose = require('mongoose');

const OpenHourSchema = mongoose.Schema({
    date: String,
    opening: String,
    closing: String,
},{ _id : false });

const StoreSchema = mongoose.Schema({
    type: String,
    id: String,
    name: String,
    address: {
        street: String,
        street2: String,
        zipCode: String,
        city: String,
        area: String,
    },
    phone: String,
    storeType: String,
    services: String,
    searchTags: [],
    openHours: [OpenHourSchema],
    location: {
        lat: String,
        lng: String,
    },
    locationRT90: {
        rt90x: String,
        rt90y: String
    }
});



mongoose.model('Store', StoreSchema, 'stores');

module.exports = mongoose.model('Store');