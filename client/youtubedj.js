var user = function () {
  return Users.findOne(Session.get('user_id'));
};

var add_song = function (name, artist, link) {
	Songs.insert({name: name, 
								artist: artist, 
								link: link});
}

var get_current = function() {
	return Current.findOne();
}

var get_video_player = function () {
	return document.getElementById('ytPlayer');
}

var convert_link = function(link) {
  var regex = /(\?v=|\&v=|\/\d\/|\/embed\/|\/v\/|\.be\/)([a-zA-Z0-9\-\_]+)/;
  var youtubeurl = link;
  var regexyoutubeurl = youtubeurl.match(regex);
  if (regexyoutubeurl) {
      return 'http://youtube.com/v/' + regexyoutubeurl[2] + '&version=3';
  }
}

var change_song = function (song_id, timestamp) {
	var video_player = get_video_player();
	var song = Songs.findOne(song_id);
	if (!song) {
		console.log("error: change song fail, not found: " + song_id);
	} else {
			video_player.loadVideoByUrl({mediaContentUrl:convert_link(song.link), 
																	 startSeconds:timestamp});

			Current.update(get_current()._id, {song_id: song_id,
																			timestamp: timestamp,
																		 user_id: Session.get('user_id')});
	}

}

Template.current.update_song = function () {
	
	var video_player = get_video_player();	
	if (video_player==null) {

		var current = get_current();
		if (current == null)
			return;
		var song = Songs.findOne(current.song_id);
		//TODO error checking here

    // Lets Flash from another domain call JavaScript
    var params = { allowScriptAccess: "always" };
    // The element id of the Flash embed
    var atts = { id: "ytPlayer" };
    // All of the magic handled by SWFObject (http://code.google.com/p/swfobject/)
    swfobject.embedSWF(convert_link(song.link), 
                       "videoDiv", "480", "295", "9", null, null, params, atts);
	} else {
		var current = get_current();
		var song = Songs.findOne(current.song_id);
		video_player.loadVideoByUrl({mediaContentUrl:convert_link(song.link), 
																	 startSeconds:current.timestamp});
	}
}

Template.hello.greeting = function () {
  return "Welcome to youtubedj.";
};

Template.hello.events({
  'click input' : function () {
    // template data, if any, is available in 'this'
    if (typeof console !== 'undefined')
      console.log("You pressed the button");
  }
});

Meteor.startup(function () {
  // Allocate a new user id.
  //
  // XXX this does not handle hot reload. In the reload case,
  // Session.get('user_id') will return a real id. We should check for
  // a pre-existing user, and if it exists, make sure the server still
  // knows about us.
  var user_id = Users.insert({name: '', idle: false});
  Session.set('user_id', user_id);

  // subscribe to all the users, the game i'm in, and all
  // the words in that game.
  Deps.autorun(function () {
    Meteor.subscribe('users');
    Meteor.subscribe('current');

    if (Session.get('user_id')) {
      var me = user();
      // if (me && me.game_id) {
      //   Meteor.subscribe('games', me.game_id);
      //   Meteor.subscribe('words', me.game_id, Session.get('user_id'));
      // }
    }
  });

  // send keepalives so the server can tell when we go away.
  //
  // XXX this is not a great idiom. meteor server does not yet have a
  // way to expose connection status to user code. Once it does, this
  // code can go away.
  Meteor.setInterval(function() {
    if (Meteor.status().connected)
      Meteor.call('keepalive', Session.get('user_id'));
  }, 20*1000);
});


///////
/////// Songs template
///////

Template.songs.count = function () {
  var songs = Songs.find({});

  return songs.count();
};

Template.songs.song = function () {
  var songs = Songs.find({});

  return songs;
};
Template.songs.events({
	'click button.add_song': function (evt) {
  	var newsong = $('#songs input#newsong').val().trim();
    $('#songs input#newsong') = '';
    Songs.insert({name:'Billie Jean', link: newsong, user_id: Session.get('user_id')});
  }
});


//////
////// lobby template: shows everyone not currently playing, and
////// offers a button to start a fresh game.
//////

Template.lobby.show = function () {
  // only show lobby if we're not in a game
  return true;
};

Template.lobby.waiting = function () {
  var users = Users.find({_id: {$ne: Session.get('user_id')},
                              name: {$ne: ''},
                              game_id: {$exists: false}});

  return users;
};

Template.lobby.count = function () {
  var users = Users.find({_id: {$ne: Session.get('user_id')},
                              name: {$ne: ''},
                              game_id: {$exists: false}});

  return users.count();
};

Template.lobby.disabled = function () {
  var me = user();
  if (me && me.name)
    return '';
  return 'disabled="disabled"';
};


Template.lobby.events({
  'keyup input#myname': function (evt) {
    var name = $('#lobby input#myname').val().trim();
    Users.update(Session.get('user_id'), {$set: {name: name}});
  },
  'click button.startgame': function () {
    Meteor.call('start_new_game');
  }
});