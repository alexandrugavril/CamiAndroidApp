/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

function changeIcon(domImg,srcImage)
{
    var img = new Image();
    img.onload = function()
    {
        // Load completed
        domImg.src = this.src;
    };
    img.src = srcImage;
}

function getImageForReminderType(type)
{
    switch(type) {
        case ('medication'):
            return 'img/pill-2-xxl.png';
        case ('appointment'):
            return 'img/journal-menu.png';
        case ('weight'):
            return 'img/weight-warning.png';
        case ('heart'):
            return 'img/heart-ok.png';
        case ('steps'):
            return 'img/steps-ok.png';
        case ('exercise'):
            return 'img/steps-ok.png';
        default:
            return ""
    }
}

function getImageForReminderStatus(status)
{
    if(status !== undefined)
    {
        if(status)
        {
            return "img/acknowledged.png";
        }
        else{
            return "img/notAcknowledged.png";
        }
    }
    else{
        return "img/null_acknowledged.png";
    }
}


function checkReminder()
{
    console.log("Check: " + app.model.latestReminders[0]);
    var url = "http://cami.vitaminsoftware.com:8008/api/v1/journal_entries/" + app.model.latestReminders[0].id + "/";
    $.ajax({
        url : url,
        data : JSON.stringify({'acknowledged': true}),
        type : 'PATCH',
        contentType : 'application/json',
        success: function () {
            console.log("Checked");
            location.reload();

        },
        error: function () {
            alert("Reminder was not acknowledged.");
            location.reload();

        }
    });

}

function checkIfUserAlreadyLogged()
{
    var user = window.localStorage.getItem("user");
    return user !== undefined;
}

function cancelReminder()
{
    console.log("Cancel: " + app.model.latestReminders[0]);
    var url = "http://cami.vitaminsoftware.com:8008/api/v1/journal_entries/" + app.model.latestReminders[0].id + "/";
    $.ajax({
        url : url,
        data : JSON.stringify({'acknowledged': false}),
        type : 'PATCH',
        contentType : 'application/json',
        success: function () {
            console.log("Canceled");
            location.reload();

        },
        error: function () {
            alert("Reminder was not acknowledged.");
            location.reload();

        }
    });
}

function getRandomNumber(rangeInit, rangeFinal)
{
    return Math.floor(Math.random() * rangeFinal) + rangeInit;
}

function getActivities(userId)
{
    var d = new Date();
    var dateOffset = 30*60*1000;

    app.model.nextActivity = {
        severityClass: "high" + ' col-9',
        dayWeek: moment(d).format('ddd'),
        day: moment(d).format('DD'),
        month: moment(d).format('MMM').toUpperCase(),
        hourFormatted: moment(d).format('HH:mm'),
        currentDate: "Today " + moment(new Date()).format("DD MMM"),
        urgencyType: "next-type",
        date: d,
        message: "Sticky",
        description: "Sticky descr",
        location: "Awesome location"
    };

    app.model.activities = [];

    for(var i = 0 ; i < 10; i++)
    {
        var groupDateFormatted = moment(d).format('ddd D MMM');
        var hourFormatted = moment(d).format('HH:mm');
        var urgencyType = "old-type";
        var severity = "high";

        if(i % 3 === 0)
        {
            urgencyType = "old-type";
            severity = "low";
            d.setDate(d.getDate() - getRandomNumber(1,30*60*1000*7));
        }
        if(i % 4 === 0)
        {
            severity = "none";
            urgencyType = "future-type";
        }

        var activity = {
            severityClass: severity + ' col-9',
            dayWeek: moment(d).format('ddd'),
            day: moment(d).format('DD'),
            month: moment(d).format('MMM'),
            hourFormatted: hourFormatted,
            urgencyType: urgencyType,
            date: d,
            message: "Try this for a change",
            description: "Awesome description",
            location: "Awesome location"
        };
        app.model.activities.push(activity);
    }
    app.model.$apply();
}


function getReminders(userId)
{
    $.ajax({
        url: "http://cami.vitaminsoftware.com:8008/api/v1/journal_entries/?user=" + userId,
        dataType: "json",
        type: 'GET',
        success: function (data) {
            var rems = data.objects;
            var cnt = 0;
            var nCnt = 0;
            var remsByDay = {};
            var d = new Date();
            var dateOffset = 30*60*1000;
            d.setTime(d.getTime() - dateOffset);
            app.model.latestReminders = [];

            for (var i = 0; i < rems.length; i++) {
                var timestamp = rems[i]['timestamp'];
                var t = new Date(timestamp*1000);
                var date = moment(t).format('ddd D MMM');
                rems[i].image = getImageForReminderType(rems[i]['type']);
                rems[i].date = moment(t).format('HH:mm');
                rems[i].severityClass = rems[i].severity + ' col-9';
                rems[i].statusImage = getImageForReminderStatus(rems[i].acknowledged);
                if(date in remsByDay)
                {
                    remsByDay[date].push(rems[i]);
                }
                else {
                    remsByDay[date] = [];
                    remsByDay[date].push(rems[i]);
                }
                if(t > d && !(rems[i].acknowledged === true || rems[i].acknowledged === false))
                {
                    app.model.latestReminders.push(rems[i]);
                }
            }
            app.model.reminders = remsByDay;
            app.model.$apply();

        },
        error: function () {
            alert("Cannot receive reminders. Check your internet connection!");
            logOff();
        }

    });
}

function logOff()
{
    window.localStorage.removeItem("user");
    location.reload();
    $.mobile.navigate("#login-page", { transition : "slide", info: "Login Failed"});
}

function registerNotifications()
{
    window.plugins.PushbotsPlugin.initialize("5a84222e1db2dc56731e6e63", {"android":{"sender_id":"716888555189"}});
    window.plugins.PushbotsPlugin.on("registered", function(token){

    });
    window.plugins.PushbotsPlugin.on("user:ids", function(data){
        var token = data['token'];
        var userId = data['userId'];
        var camiUserId = app.user['resource_uri'];
        window.plugins.PushbotsPlugin.updateAlias(camiUserId);
        $.ajax({
            url: "http://cami.vitaminsoftware.com:8008/api/v1/pushnotificationdevice/",
            type: 'POST',
            beforeSend: function(request) {
                request.setRequestHeader("Content-Type", 'application/json');
            },
            dataType: 'json',
            data: JSON.stringify({
                registration_id: camiUserId,
                type: "GCM",
                user: camiUserId,
                other_info: "{}"
            }),
            success: function( data, textStatus, jQxhr ){
                console.log("Registered user");
            },
            error: function( jqXhr, textStatus, errorThrown ){
                console.log("Already registered");
            }
        });
    });
}

function handleLogin() {
    var form = $("#loginForm");
    //disable the button so we can't resubmit while we wait
    var u = $("#username", form).val();
    var p = $("#password", form).val();

    checkLogin(u, p);
    return false;
}

function checkLogin(u, p)
{

    if(u !== '' && p !== '')
    {
        if (p !== 'imac') {
            Materialize.toast('Wrong Password!', 2000, 'rounded');// 4000 is the duration of the toast
        } else {
            $.getJSON("http://cami.vitaminsoftware.com:8008/api/v1/user/?username=" + u,
                function (userJson) {
                    var users = userJson['users'];
                    if(users && users.length > 0)
                    {
                        app.user = users[0];

                        var profile = users[0]['enduser_profile'];

                        if(profile)
                        {
                            var account_role = profile['account_role'];
                            if(profile.language in translations)
                            {
                                app.model.translations = translations[profile.language];
                                console.log("Language: " + "ro");
                            }
                            else {
                                app.model.translations = translations['ro'];
                                console.log("Language: ro");
                            }
                            app.model.$apply();
                            if(account_role === 'end_user')
                            {
                                //registerNotifications();
                                window.localStorage.setItem("user", JSON.stringify({'user': u, 'password': p, 'id': users[0].id}));
                                $.mobile.navigate("#enduser-page", { transition : "slide"});
                            }
                        }
                        else {
                            profile = users[0]['caregiver_profile'];
                            if(profile)
                            {
                                if(profile.language in translations)
                                {
                                    app.model.translations = translations[profile.language];
                                    console.log("Language: " + "ro");
                                }
                                else {
                                    app.model.translations = translations['ro'];
                                    console.log("Language: ro");
                                }
                                app.model.$apply();
                                var account_role = profile['account_role'];
                                if(account_role === 'caregiver')
                                {
                                    //registerNotifications();
                                    window.localStorage.setItem("user",  JSON.stringify({'user': u, 'password': p,'id': users[0].id}));
                                    $.mobile.navigate("#caregiver-page", { transition : "slide"});
                                }
                            }
                            else {
                                Materialize.toast('Wrong Username!', 2000, 'rounded');// 4000 is the duration of the toast
                                logOff();
                            }
                        }
                    }
                    else {
                        Materialize.toast('Wrong Username!', 2000, 'rounded');// 4000 is the duration of the toast
                        logOff();
                    }
                }).error(
                function() {
                    Materialize.toast('Connection failed! Please try again later.', 2000, 'rounded');// 4000 is the duration of the toast
                    logOff();
                }
            );

        }


        /*
        if(u === 'catalin' && p === 'imac') {
            window.localStorage["username"] = u;
            window.localStorage["password"] = p;
            $.mobile.navigate("#first-page", { transition : "slide"});
        }
        else if(u === 'andrei' && p === 'cami')
        {
            window.localStorage["username"] = u;
            window.localStorage["password"] = p;
            $.mobile.navigate("#second-page", { transition : "slide"});
        }
        else {
            navigator.notification.alert("Your login failed", function() {});
        }
        */
    }
    else {
        Materialize.toast('You must enter a username and password!', 4000, 'rounded');// 4000 is the duration of the toast

    }
}

function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild;
}

var app = {
    SOME_CONSTANTS : false,  // some constant
    user: {},
    reminders: [],
    currentReminder: -1,

    plotWeightChart: function(ctx, ctx2) {
        var url = "http://cami.vitaminsoftware.com:8008/api/v1/measurement/?measurement_type=weight&limit=7&order_by=-timestamp&user=2";
        $.ajax({
            url: url,
            dataType: "json",
            type: 'GET',
            success: function (data) {
                var pData = data.measurements.reverse();
                var labs = [];
                var dataValues = [];
                for (var i = 0; i < pData.length; i++) {
                    var t = new Date(pData[i].timestamp*1000);
                    var month = t.getMonth() + 1;
                    if(month < 10)
                    {
                        month = "0" + month;
                    }
                    var formatted = t.getDate() + "/" + month;
                    labs.push(formatted);
                    dataValues.push(pData[i].value_info.value);
                }
                var latestValue = pData[pData.length - 1].value_info.value;
                ctx2.innerHTML = latestValue;

                var myChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labs,
                        datasets: [{
                            label: 'Weight',
                            data: dataValues,
                            backgroundColor:
                                'rgba(122,122, 132, 0.2)'
                            ,
                            borderColor: 'rgba(122,122,132,1)'

                        }]
                    },
                    options: {
                        maintainAspectRatio: true,
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: false,
                                }
                            }]
                        }
                    }
                });
            }
        });
    },
    plotHeartRateChart: function(ctx, ctx2) {
        var url = "http://cami.vitaminsoftware.com:8008/api/v1/measurement/?measurement_type=pulse&limit=7&order_by=-timestamp&user=2";
        $.ajax({
            url: url,
            dataType: "json",
            type: 'GET',
            success: function (data) {
                var pData = data.measurements.reverse();
                var labs = [];
                var dataValues = [];
                for (var i = 0; i < pData.length; i++) {
                    var t = new Date(pData[i].timestamp*1000);
                    var month = t.getMonth() + 1;
                    if(month < 10)
                    {
                        month = "0" + month;
                    }
                    var formatted = t.getDate() + "/" + month;
                    labs.push(formatted);
                    dataValues.push(pData[i].value_info.value);
                }
                var latestValue = pData[pData.length - 1].value_info.value;
                ctx2.innerHTML = latestValue;

                var myChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labs,
                        datasets: [{
                            label: 'Heart Rate',
                            data: dataValues,
                            backgroundColor:'rgba(255,99, 132, 0.2)',
                            borderColor:  'rgba(255,99,132,1)'

                        }]
                    },
                    options: {
                        maintainAspectRatio: true,
                        scales: {
                            yAxes: [{
                                ticks: {
                                }
                            }]
                        }
                    }
                });
            }
        });


    },
    plotBloodPressureChart: function(ctx, ctx2) {
        var url = "http://cami.vitaminsoftware.com:8008/api/v1/measurement/?measurement_type=blood_pressure&limit=7&order_by=-timestamp&user=2";
        $.ajax({
            url: url,
            dataType: "json",
            type: 'GET',
            success: function (data) {
                var pData = data.measurements.reverse();
                var labs = [];
                var diastolicValues = [];
                var systolicValues = [];
                var backgroundColorD= [];
                var borderColorD= [];
                var backgroundColorS = [];
                var borderColorS = [];
                for (var i = 0; i < pData.length; i++) {
                    var t = new Date(pData[i].timestamp*1000);
                    var month = t.getMonth() + 1;
                    if(month < 10)
                    {
                        month = "0" + month;
                    }
                    var formatted = t.getDate() + "/" + month;
                    labs.push(formatted);
                    diastolicValues.push(pData[i].value_info.diastolic);
                    backgroundColorD.push('rgba(255, 99, 132, 0.2)');
                    backgroundColorS.push('rgba(255, 99, 0, 0.2)');
                    borderColorD.push('rgba(255,99,132,1)');
                    borderColorS.push('rgba(255,99,0,1)');
                    systolicValues.push(pData[i].value_info.systolic);
                }
                var latestValue = pData[pData.length - 1].value_info.systolic + "/" + pData[pData.length - 1].value_info.diastolic;
                ctx2.innerHTML = latestValue;


                var lineChartData = {
                    labels: labs,
                    datasets: [{
                        label: "Diastolic",
                        backgroundColor: backgroundColorD,
                        borderColor: borderColorD,
                        fill: false,
                        data: diastolicValues,
                        yAxisID: "y-axis-1",
                    }, {
                        label: "Systolic",
                        backgroundColor: backgroundColorS,
                        borderColor: borderColorS,
                        fill: false,
                        data: systolicValues,
                    }]
                };


                var myChart  = Chart.Bar(ctx, {
                    data: lineChartData,
                    scaleOverride: true,
                    scaleSteps: 5,
                    scaleStepWidth: 5,
                    options: {

                        maintainAspectRatio: true,
                        responsive: true,
                        hoverMode: 'index',
                        stacked: false,
                        scales: {
                            yAxes: [{
                                type: "linear", // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                                display: true,
                                position: "left",
                                beginAtZero: true,
                                fontSize: 12,
                                id: "y-axis-1"
                            }],
                            xAxes: [{
                                fontSize: 12,
                                id: "x-axis-1"
                            }]
                        }
                    }
                });
            }
        });

    },

    // Application Constructor
    initialize: function() {
        this.bindEvents();
        this.initFastClick();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    initFastClick : function() {
        window.addEventListener('load', function() {
            FastClick.attach(document.body);
        }, false);
    },
    // Phonegap is now ready...
    onDeviceReady: function() {

    }


};