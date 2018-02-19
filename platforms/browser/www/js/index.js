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


function checkPreAuth() {
    var form = $("#loginForm");
    console.log("checking preauth");
    if(window.localStorage["username"] !== undefined && window.localStorage["password"] !== undefined) {
        $("#username", form).val(window.localStorage["username"]);
        $("#password", form).val(window.localStorage["password"]);
        handleLogin();
    }
}

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

function updateLogo(type)
{
    var logo = document.getElementById("logo");
    switch(type){
        case ('medication'):
            changeIcon(logo, 'img/pill-2-xxl.png');
            console.log("medication");
            break;
        case ('appointment'):
            changeIcon(logo, 'img/journal-menu.png');
            console.log("it's an appointment appointment");
            break;
        case ('weight'):
            changeIcon(logo, 'img/weight-warning.png');
            console.log("weight");
            break;
        case ('heart'):
            changeIcon(logo, 'img/heart-ok.png');
            console.log("heart");
            break;
        case ('steps'):
            changeIcon(logo, 'img/steps-ok.png');
            console.log("steps");
            break;
        default:
            return

    }
}

function previousReminder()
{
    app.setCurrentReminder(app.currentReminder - 1);
}

function nextReminder()
{
    app.setCurrentReminder(app.currentReminder + 1);
}

function getLatestReminders()
{
    console.log("Meh");
}

function getReminders()
{
    console.log("Receiving reminders");
    $.ajax({
        url: "http://cami.vitaminsoftware.com:8008/api/v1/journal_entries/?user=2",
        dataType: "json",
        type: 'GET',
        success: function (data) {
            console.log(data);
            var rems = data.objects;
            console.log(rems);
            app.reminders = rems;
            var cnt = 0;
            var nCnt = 0;
            for (var i = 0; i < rems.length; i++) {
                if (rems[i].acknowledged === true || rems[i].acknowledged === false) {
                    nCnt = nCnt + 1;
                }
                else {
                    app.setCurrentReminder(i);
                    break;
                }
            }
        },
        error: function () {
            alert("Cannot receive reminders. Check your internet connection!");
            $.mobile.navigate("#login-page", { transition : "slide", info: "Login Failed"});
        }

    });
}

function handleLogin() {
    var form = $("#loginForm");
    //disable the button so we can't resubmit while we wait
    var u = $("#username", form).val();
    var p = $("#password", form).val();

    if(u !== '' && p !== '')
    {
        if (p !== 'imac') {
        } else {
            $.getJSON("http://cami.vitaminsoftware.com:8008/api/v1/user/?username=" + u,
                function (userJson) {
                    var users = userJson['users'];
                    if(users && users.length > 0)
                    {
                        window.localStorage["user"] = users[0];
                        var profile = users[0]['enduser_profile'];

                        if(profile)
                        {
                            var account_role = profile['account_role'];
                            if(account_role === 'end_user')
                            {
                                $.mobile.navigate("#enduser-page", { transition : "slide"});
                            }
                        }
                        else {
                            profile = users[0]['caregiver_profile'];
                            if(profile)
                            {
                                var account_role = profile['account_role'];
                                if(account_role === 'caregiver')
                                {
                                    $.mobile.navigate("#caregiver-page", { transition : "slide"});
                                }
                            }
                            else {
                                alert('Login Failed');
                                $.mobile.navigate("#login-page", { transition : "slide", info: "Login Failed"});
                            }
                        }
                    }
                    else {
                        alert('Login Failed');
                        $.mobile.navigate("#login-page", { transition : "slide", info: "Login Failed"});
                    }
                }).error(
                    function() {
                        alert('Login Failed');
                        $.mobile.navigate("#login-page", { transition : "slide", info: "Login Failed"});
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
        alert("You must enter a username and password!", function() {});
    }
    return false;
}



var app = {
    SOME_CONSTANTS : false,  // some constant

    reminders: [],
    currentReminder: -1,
    setCurrentReminder: function(i)
    {
        if(i >= this.reminders.length)
        {
            this.currentReminder = 0;
        }
        else if(i < 0)
        {
            this.currentReminder = this.reminders.length - 1;
        }
        else{
            this.currentReminder = i;
        }

        $('#enduser-journal-header-reminderContent').html(this.reminders[this.currentReminder].message);
        updateLogo(this.reminders[this.currentReminder].type);
    },

    // Application Constructor
    initialize: function() {
        console.log("console log init");
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
        console.log("Device ready");
        window.plugins.PushbotsPlugin.initialize("5a84222e1db2dc56731e6e63", {"android":{"sender_id":"716888555189"}});
        window.plugins.PushbotsPlugin.on("registered", function(token){
            console.log("Registration Id:" + token);
        });
    }


};