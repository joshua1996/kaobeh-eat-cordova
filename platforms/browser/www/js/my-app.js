//phone must enable wifi to access google map locate!!!

Template7.global = {
    url: 'http://kaobeheat.bojioong.xyz/'
};
//http://kaobeheat.bojioong.xyz/
//http://localhost/kaobeh-eat-db/
var app = new Framework7({
    init: false,
    // App root element
    root: '#app',
    // App Name
    name: 'KaoBeh Eat',
    theme: 'ios',
    // App id
    id: 'com.indieDream.kaobeheat',
    precompileTemplates: false,
    // Unabled pages rendering using Template7
    template7Pages: false,
    routes: [{
        path: '/',
        url: 'index.html',
    }, {
        path: '/home/',
        url: 'home.html',
    }, {
        path: '/place/',
        url: 'place.html',
    }, {
        path: '/map/',
        url: 'map.html',
    }, {
        path: '/restaurant/',
        url: 'restaurant.html',
    }, {
        path: '/food/:restaurant/:index',
        url: './food.html',
    }, {
        path: '/foodBuy/:foodID/:category/:index',
        url: 'food_buy.html',
    }, {
        path: '/cart/',
        url: 'cart.html',
    }, {
        path: '/foodBuyUpdate/:orderID',
        url: 'food_buy_update.html',
    }],
});
var $$ = Dom7;
var mainView = app.views.create('.view-main', {});
$(document).on('page:init', '.page[data-name="intro"]', function (e) {
    if (localStorage.getItem('skipIntro') === null) {} else {
        $('.page[data-name="intro"]').remove();
        mainView.router.navigate('/home/');
    }
});
app.init();

$$(document).on('deviceready', function() {
 
});

var swiper = app.swiper.create('.swiper-container', {
    pagination: {
        el: '.swiper-pagination',
        type: 'bullets',
    },
});

/**
 * home
 */
var db;
$(document).on('page:init', '.page[data-name="home"]', function (e) {
    console.log('aa');

    const customerData = [{
            foodID: "444-44-4444",
            name: "Bill",
            age: 35,
            email: "bill@company.com"
        },
        {
            foodID: "555-55-5555",
            name: "Donna",
            age: 32,
            email: "donna@home.org"
        }
    ];
    const dbName = "KaoBehEat";

    var request = indexedDB.open(dbName, 3);

    request.onsuccess = function (event) {
        db = this.result;
    };
    request.onerror = function (event) {};
    request.onupgradeneeded = function (event) {
        var objectStore = event.currentTarget.result.createObjectStore("cart", {
            keyPath: "orderID"
        });
        // objectStore.createIndex('foodID', 'foodID', {
        //     unique: true
        // });
    };
});


/**
 * map.html
 */

var circle;
var map;
$(document).on('page:init', '.page[data-name="map"]', function (e) {

    cordova.plugins.notification.local.schedule({
        title: "Notification 1 Title",
        text: "Notification Text",
        led: "FF0000",
        badge: 1
    });
    
    map = new GMaps({
        el: '#map',
        lat: -12.043333,
        lng: -77.028333

    });
    GMaps.geolocate({
        enableHighAccuracy: false,
        success: function (position) {
            map.setCenter(position.coords.latitude, position.coords.longitude);
        },
        error: function (error) {
            alert('Geolocation failed: ' + error.message);
        },
        not_supported: function () {
            alert("Your browser does not support geolocation");
        },
        always: function () {}
    });
});

$(document).on('click', '#getStartBtn', function () {
    localStorage.setItem('skipIntro', true);
});
$(document).on('page:afterout', '.page[data-name="intro"]', function (e) {
    $('.page[data-name="intro"]').remove();
});

$(document).on('click', '.mapfindrestaurent', function () {
    app.dialog.preloader();
    circle = map.drawCircle({
        lat: map.getCenter().lat(),
        lng: map.getCenter().lng(),
        radius: 100000,
        fillColor: 'yellow',
        fillOpacity: 0.5,
        strokeWeight: 0
    });
    var data = {
        action: 'restaurantWithinRadius',
        lat: map.getCenter().lat(),
        lng: map.getCenter().lng()
    };
    app.request.json(Template7.global.url + 'restaurant.php', data, function (data) {
        var markers_data = [];
        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            if (item.lat != undefined && item.lng != undefined) {
                var icon = 'https://foursquare.com/img/categories/food/default.png';

                markers_data.push({
                    lat: item.lat,
                    lng: item.lng,
                    title: item.restaurantID,
                    icon: {
                        size: new google.maps.Size(32, 32),
                        url: icon
                    }
                });
            }
        }
        map.addMarkers(markers_data);
        var location = [];
        $.each(data, function (i, v) {
            if (map.checkGeofence(v.restaurant_lat, v.restaurant_lng, circle)) {
                location.push(v);
            }
        });
        if (location.length > 0) {
            app.dialog.close();
            mainView.router.navigate('/restaurant/');
        } else {
            app.dialog.close();
            app.dialog.alert('附近没有餐厅！');
        }
    });
});

/**
 * restaurant.html
 * FIXME: restaurant page - open cart - no list !!
 */
$(document).on('page:init', '.page[data-name="restaurant"]', function () {
    var transaction = db.transaction(["cart"], "readwrite");
    var objectStore = transaction.objectStore("cart");
    var request = objectStore.count();
    request.onsuccess = function (event) {
        if (request.result > 0) {
            $('.cartBadge').text(request.result);
        } else {
            $('.cartBadge').css('display', 'none');
        }
    };

    var data = {
        action: 'restaurantWithinRadius',
        lat: map.getCenter().lat(),
        lng: map.getCenter().lng()
    };
    app.request.json(Template7.global.url + 'restaurant.php', data, function (data) {
        var obj = {
            'restaurant': data
        };
        var template = $('#template').html();
        var compiledTemplate = Template7.compile(template);
        var html = compiledTemplate(obj);
        $('.page[data-name="restaurant"] .page-content').html(html);
        Template7.global.restaurant = data;
    });

});

/**
 * food.html
 */
$(document).on('page:init', '.page[data-name="food"]', function (e) {
    var transaction = db.transaction(["cart"], "readwrite");
    var objectStore = transaction.objectStore("cart");
    var request = objectStore.count();
    request.onsuccess = function (event) {
        if (request.result > 0) {
            $('.cartBadge').text(request.result);
        } else {
            $('.cartBadge').css('display', 'none');
        }
    };

    $('.foodTitle').text(Template7.global.restaurant[e.detail.route.params.index].restaurant_name);
    var data = {
        action: 'findFoodByRestaurant',
        restaurantID: e.detail.route.params.restaurant
    };
    app.request.json(Template7.global.url + 'restaurant.php', data, function (data) {
        var groupedData = _.groupBy(data, 'food_category');
        var obj = {
            'restaurant': data,
            'index': groupedData
        };
        Template7.global.foodlist = groupedData;
        var template = $('#template_category').html();
        var compiledTemplate = Template7.compile(template);
        var html = compiledTemplate(obj);
        $('.page[data-name="food"] .page-content').html(html);
    });
});

/**
 * food_buy.html
 */
$(document).on('page:init', '.page[data-name="foodBuy"]', function (e) {
    var quantityV = 1;
    var totalPrice = 0;
    console.log(Template7.global.foodlist);
    $('.price').text('RM ' + (parseFloat(Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].food_price)).toFixed(2));
    $('.foodImg').css('background-image', 'url(' + Template7.global.url + 'img/food/' + Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].food_img + ')');
    $('.foodBuyTitle').text(Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].food_name);
    var pickerDevice = app.picker.create({
        inputEl: '#demo-picker-device',
        cols: [{
            textAlign: 'center',
            values: (function () {
                var arr = [];
                for (var i = 1; i <= 59; i++) {
                    arr.push(i);
                }
                return arr;
            })(),
        }]
    });
    pickerDevice.setValue([1]);

    var transaction = db.transaction(["cart"], "readwrite");
    var objectStore = transaction.objectStore("cart");
    var request = objectStore.get(Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].food_foodID);
    request.onsuccess = function (event) {
        // if (request.result != null) {
        //     quantityV = request.result.quantity;
        //     pickerDevice.setValue([request.result.quantity]);
        // }else{
        //     pickerDevice.setValue([1]);
        // }
    };

    pickerDevice.on('close', function (picker, values, displayValues) {
        $('.price').text('RM ' + (picker.getValue() * Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].food_price).toFixed(2));
        totalPrice = (picker.getValue() * Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].food_price).toFixed(2);
        quantityV = picker.getValue()[0];
    });

    var data = {
        action: 'foodDetail',
        foodID: e.detail.route.params.foodID
    };

    $(document).off('click').on('click', '.addToCart', function () {
        if (totalPrice == 0) {
            totalPrice = (pickerDevice.getValue()[0] * Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].food_price).toFixed(2);
        }

        var transaction = db.transaction(["cart"], "readwrite");
        var objectStore = transaction.objectStore("cart");
        var request1 = objectStore.getAll();
        request1.onsuccess = function (event) {
            if (request1.result.length == 0 || Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].restaurant_restaurantID == request1.result[0].restaurantID) {
                var request = objectStore.put({
                    orderID: String(new Date().getTime()),
                    foodID: Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].food_foodID,
                    foodName: Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].food_name,
                    quantity: quantityV,
                    price: totalPrice,
                    restaurantID: Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].restaurant_restaurantID,
                    restaurantImg: Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].restaurant_img,
                    remark: $('.remark').val(),
                    foodImg: Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].food_img
                });
                request.onsuccess = function (evt) {
                    console.debug("Insertion in DB successful");
                    mainView.router.back();
                };
                request.onerror = function () {
                    console.error("add error", this.error);
                };
            } else {
                app.dialog.confirm('There are items in your cart from a different restaurant, changing restaurant will clear all items from the cart, are you sure you want to change?', function () {
                    var transaction = db.transaction(["cart"], "readwrite");
                    var objectStore = transaction.objectStore("cart");
                    var objectStoreRequest = objectStore.clear();
                    objectStoreRequest.onsuccess = function (event) {
                        var request = objectStore.put({
                            orderID: String(new Date().getTime()),
                            foodID: Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].food_foodID,
                            foodName: Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].food_name,
                            quantity: quantityV,
                            price: totalPrice,
                            restaurantID: Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].restaurant_restaurantID,
                            restaurantImg: Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].restaurant_img,
                            remark: $('.remark').val(),
                            foodImg: Template7.global.foodlist[e.detail.route.params.category][e.detail.route.params.index].food_img
                        });
                        request.onsuccess = function (evt) {
                            console.debug("Insertion in DB successful");
                            mainView.router.back();
                        };
                    };
                });
            }
        };
    });
});

/**
 * cart.html
 */
$(document).on('page:init', '.page[data-name="cart"]', function (e) {
    var transaction = db.transaction(["cart"], "readwrite");
    var objectStore = transaction.objectStore("cart");
    var request = objectStore.getAll();
    request.onsuccess = function (event) {
        if (request.result.length > 0) {
            $('.restaurantImg').attr('data-background', Template7.global.url + 'img/restaurant/' + request.result[0].restaurantImg);
            var obj = {
                'cartFoodList': request.result
            };
            var template = $('#template').html();
            var compiledTemplate = Template7.compile(template);
            var html = compiledTemplate(obj);
            $('.page[data-name="cart"] .page-content .list ul').html(html);
        }

    };
});

/**
 * food_buy_update.html
 */
$(document).on('page:init', '.page[data-name="foodBuyUpdate"]', function (e) {
    app.dialog.preloader();
    var orderID;
    var transaction = db.transaction(["cart"], "readwrite");
    var objectStore = transaction.objectStore("cart");
    var request = objectStore.get(e.detail.route.params.orderID);
    request.onsuccess = function (event) {
        app.dialog.close();
        console.log(e.detail.route.params.orderID);
        console.log(request);
        orderID = request.result.orderID;
        $('.foodImg').css('background-image', 'url(' + Template7.global.url + 'img/food/' + request.result.foodImg + ')');
        $('.foodBuyTitle').text(request.result.foodName);
        var pickerDevice = app.picker.create({
            inputEl: '#demo-picker-device',
            cols: [{
                textAlign: 'center',
                values: (function () {
                    var arr = [];
                    for (var i = 1; i <= 59; i++) {
                        arr.push(i);
                    }
                    return arr;
                })(),
            }]
        });
        pickerDevice.setValue([request.result.quantity]);
        $('.remark').val(request.result.remark);

        $(document).off('click').on('click', '.addToCart', function () {
            var transaction = db.transaction(["cart"], "readwrite");
            var objectStore = transaction.objectStore("cart");
            objectStore.openCursor().onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.orderID === e.detail.route.params.orderID) {
                        var updateData = cursor.value;

                        updateData.quantity = pickerDevice.getValue()[0];
                        updateData.remark = $('.remark').val();
                        var request = cursor.update(updateData);
                        request.onsuccess = function () {
                            mainView.router.back({
                                force: true,
                                ignoreCache: true
                            });

                        };
                    };

                    // var listItem = document.createElement('li');
                    // listItem.innerHTML = '<strong>' + cursor.value.albumTitle + '</strong>, ' + cursor.value.year;
                    // list.appendChild(listItem);
                    // cursor.continue();
                } else {
                    console.log('Entries displayed.');
                }
            };
            // var request = objectStore.put({
            //     orderID: orderID,
            //     quantity: pickerDevice.getValue()[0],
            //     remark: $('.remark').val()
            // });
            // request.onsuccess = function (evt) {
            //     console.log("Insertion in DB successful");
            //     mainView.router.back();
            // };
        });
    };


});


// git remote add 5apps git@5apps.com:joshua1996_kaobeheat.git
// git push 5apps master