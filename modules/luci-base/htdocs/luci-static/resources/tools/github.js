'use strict';

return L.Class.extend({
    desc: function(description, username, project) {
        return "<table style='border: 0;'>" +
                    "<tr>" +
                        "<td style='border: 0;'>" + _(description) + "</td>" +
                        "<td style='border: 0;'>" +
                            "<a href='https://github.com/" + username + "/" + project + "' target='_blank'>" +
                                "<img alt='" + project + "' src='https://img.shields.io/github/stars/" + username + "/" + project + "?style=social' />" +
                            "</a>" +
                        "</td>" +
                    "</tr>" +
                "</table>";
    }
}); 