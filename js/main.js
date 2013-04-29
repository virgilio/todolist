jQuery(document).ready(function(){
    jQuery.baseUrl = "http://localhost:9000/tasks"

    jQuery(".datepicker").datepicker();
    jQuery(".datepicker-modal").datepicker();

    jQuery(document).ajaxStart(function(){
        jQuery("#circleG").css({visibility : "visible"});
    });
    
    jQuery(document).ajaxStop(function(){
        jQuery("#circleG").css({visibility : "hidden"});
    });

    jQuery.getOpenTasks = (function(order){        
        jQuery.ajax({
            url: jQuery.baseUrl + "?status=open",
            data: order ? "orderBy=" + order : "",
            dataType: 'json',
            success: function(msg){
                var tasks = msg;
                jQuery.each(tasks, function(i, item){
                    jQuery("#task-list .open-tasks-container").append(getItem(item, true));
                });
            }
        });
    });

    jQuery.getDoneTasks = (function(){
        jQuery.ajax({
            url: jQuery.baseUrl + "?status=done",
            dataType: 'json',
            success: function(msg){
                var tasks = msg;
                jQuery.each(tasks, function(i, item){
                    jQuery("#done-task-list").append(getItem(item));
                });
            }
        });
    });
    
    jQuery.getOpenTasks();
    jQuery.getDoneTasks();
    jQuery.editingModal = jQuery('#edit-task-modal').modal({
        show : false, 
        keyboard : true
    });
    
    jQuery("form[name=add-task]").submit(function(e){
        e.preventDefault();
        var form = jQuery(this);
        jQuery.ajax({
            url: jQuery.baseUrl ,
            type: form.attr("method"),
            data: form.serialize(),
            success: function(msg) {
                jQuery("#task-list .open-tasks-container").append(getItem(msg, true));
            }
        });
        form.each(function(){this.reset();});
        return false;
    });

    jQuery("form[name=edit-task]").submit(function(e){
        e.preventDefault();
        var form = jQuery(this);
        console.log(form.serialize());
        jQuery.ajax({
            url: jQuery.baseUrl + "/" + form.find("input[type=hidden]").val() + "/update",
            type: form.attr("method"),
            data: form.serialize(),
            success: function(msg) {
                //jQuery("#task-list").find("td ")
                jQuery.editingItem.remove();
                jQuery("#task-list .open-tasks-container").append(getItem(msg, true));
                jQuery.editingModal.modal('hide');
            }
        });
        form.each(function(){this.reset();});
        return false;
    });

    jQuery("#orderByPriority").click(function(){
        jQuery(".open-tasks-container").children().fadeOut().remove();
        jQuery.getOpenTasks("priority desc");
        jQuery(".open-tasks-container").fadeIn();
    });

    jQuery("#orderByDueDate").click(function(){
        jQuery(".open-tasks-container").children().fadeOut().remove();
        jQuery.getOpenTasks("due asc");
        jQuery(".open-tasks-container").fadeIn();
    });

    jQuery.editingItem;

    jQuery.bindactions =  (function (item) { 
        item.find("a.task-delete").bind('click', function(e){
            e.preventDefault();
            var task = jQuery(this).parent().parent().parent();
            var url = jQuery(this).attr("href");
            jQuery.ajax({
                url: url,
                type: 'POST',
                success: function(msg) {
                    task.fadeOut();
                    task.remove();
                }
            });            
            return false;
        });

        item.find("a.task-done").bind('click', function(e){
            e.preventDefault();
            var task = jQuery(this).parent().parent().parent().parent().parent().parent();
            var url = jQuery(this).attr("href");
            jQuery.ajax({
                url: url,
                type: 'POST',
                success: function(msg) {                    
                    task.fadeOut(function(){
                        jQuery.makeTaskDone(task);
                        jQuery("#done-task-list > li:first").delay(700).append(task);
                    }).fadeIn();
                }
            });            
            return false;
        });

        item.find("a.task-edit").bind('click', function(e){
            e.preventDefault();
            var task = jQuery(this).parent().parent().parent().parent().parent().parent();
            var form = jQuery("form[name=edit-task]");
            
            form.find("input:first").val(task.find("td:first").text()); //id
            form.find("input:nth-child(3)").val(task.find("td:nth-child(2)").text()); //label
            form.find("input.datepicker-modal").val(task.find("td:nth-child(3)").text()); //due
            form.find("select").val(
                getPriorityNumber(task.find("td:nth-child(4)").parent().attr("class").split(" ")[1]));            

            jQuery.editingItem = task;
        });


        item.find("a.task-open").bind('click', function(e){
            e.preventDefault();
            var task = jQuery(this).parent().parent().parent().parent().parent().parent();
            var url = jQuery(this).attr("href");
            jQuery.ajax({
                url: url,
                type: 'POST',
                success: function(msg) {                    
                    task.fadeOut(function(){
                        jQuery.makeTaskOpen(task);
                        jQuery("#task-list .open-tasks-container").delay(700).append(task);
                    }).fadeIn();
                }
            });            
            return false;
        });
    });

    jQuery.makeTaskOpen = (function(item){
        item.find("td:nth-child(4)").html(getActions(item.find("td:first").text()));
        jQuery.bindactions(item.find("td:nth-child(4)"));
        item.find("td:nth-child(4)").parent()
            .removeClass("task-done")
            .addClass(getClassByPriority(item.find("td:nth-child(4)").parent().attr("class")));
    });

    jQuery.makeTaskDone = (function(item){
        item.find("td:nth-child(4)").html(getDoneActions(item.find("td:first").text()));
        jQuery.bindactions(item.find("td:nth-child(4)"));
        item.find("td:nth-child(4)").parent()
            .removeClass("alert-info")
            .removeClass("alert-success")
            .removeClass("alert-warning")
            .addClass("task-done");
    });

    function getItem(task, done){
        var item = jQuery('<li><table class="task-table table table-hover table-condensed"><tr><td></td><td></td><td></td><td></td></tr></table></li>');
        item.find("td:first").text(task.id);
        item.find("td:nth-child(2)").text(task.label);
        
        item.find("td:nth-child(3)").text((new Date(task.due)).toDateString());
        if(done == true) {
            item.find("td:nth-child(4)").html(getActions(task.id));
            item.find("td:nth-child(4)").parent().addClass(getPriority(task.priority));
        } else {
            item.find("td:nth-child(4)").html(getDoneActions(task.id));
            item.find("td:nth-child(4)").parent().addClass("task-done");
        }
        jQuery.bindactions(item.find("td:nth-child(4)"));

        return item;
    }

    function getActions(id){
        return '' 
            + '<div>' 
            + '  <a class="btn btn-mini btn-success task-done" '
            + '       href="http://localhost:9000/tasks/' + id + '/done" >'
            +'     <span><i class="icon-check"></i></span>'
            + '  </a>'
            + '  <a class="btn btn-mini btn-info task-edit" ' 
            + '      href="#edit-task-modal" role="button" data-toggle="modal">'
            +'     <span><i class="icon-edit"></i></span>'
            + '  </a>'
            + '  <a class="btn btn-mini btn-danger task-delete" ' 
            + '      href="http://localhost:9000/tasks/' + id + '/delete" >'
            +'     <span><i class="icon-trash"></i></span>'
            + '  </a>'
            + '</div>';
    }

    function getDoneActions(id){
        return ''
            + '<div>'
            + '  <a class="btn btn-mini btn-warning task-open" '
            + '       href="http://localhost:9000/tasks/' + id + '/open" >'
            +'     <span><i class="icon-check"></i></span>'
            + '  </a>'
            + '  <a class="btn btn-mini btn-danger task-delete" '
            + '      href="http://localhost:9000/tasks/' + id + '/delete" >'
            +'     <span><i class="icon-trash"></i></span>'
            + '  </a>'
            + '</div>';
    }


    function getPriority(n){
        if(n == 1) return "alert-success low";
        return n == 2 ? "alert-info normal" : "alert-warning high";
    }

    function getClassByPriority(p){
        if(p == "low") return "alert-success";
        return p == "normal" ? "alert-info" : "alert-warning";
    }

    function getPriorityNumber(p){
        if(p == "low") return 1;
        return p == "normal" ? 2 : 3;
    }    
});