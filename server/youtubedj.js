
if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Current.findOne({}) == null) {
      var song = Songs.findOne({});
      Current.insert({song_id: song._id,
                      timestamp: 0});
    }
  });
  // publish all the non-idle users.
  Meteor.publish('users', function () {
    return Users.find({idle: false});
  });

  Meteor.publish('songs', function () {
    return Songs.find({});
  });

  Meteor.publish('current', function () {
    return Current.find({}); 
  });
  //Songs.insert('test', 'artist', 'http://yountlabs.com/automation/disable-autocorrect-in-zsh/');
}
