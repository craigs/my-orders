{% raw %}
<script id="orders-template" type="text/x-handlebars-template">
	<table class="table">
		<thead>
			<tr>
				<th>Status</th>
				<th>Name</th>
				<th>Order Reference</th>
				<th>Date</th>
				<th>Total</th>
			</tr>
		</thead>
		<tbody>
		{{#orders}}
		<tr>
			<td><span class="label label-{{label}}">{{order_state}}</span></td>
			<td><a href="#" data-id="{{id}}" data-orders-screen="order-detail">{{first_name}} {{last_name}}</a></td>
			<td><a href="#" data-id="{{id}}" data-orders-screen="order-detail">{{reference}}</a></td>
			<td><a href="#" data-id="{{id}}" data-orders-screen="order-detail">{{created_at}}</a></td>
			<td class="total"><a href="#" data-id="{{id}}" data-orders-screen="order-detail">{{formatted_grand_total}}</a></td>
		</tr>
		{{/orders}}
		</tbody>
	</table>
</script>

<script id="no-orders-template" type="text/x-handlebars-template">
	<div class="alert alert-warning">You do not have any orders.</div>
</script>

<script id="order-detail-template" type="text/x-handlebars-template">

	{{#if has_tracking}}
		{{#shipping_trackers}}
		<div class="alert alert-success">
        	<strong>We shipped your order!</strong> <br>
        	We shipped your order via <strong>{{ organisation }}</strong> on <strong>{{ created_at }}</strong>. Your {{ reference_name }} is <strong>{{ tracking_reference }}</strong> <br>
        	<div class="mtm">
        		<a href="{{ link }}" class="btn btn-success btn-sm">Track Shipment</a>
        	</div>
		</div>
		{{/shipping_trackers}}
	{{/if}}
	
	<h1>Your Items</h1>

	<table class="table">
    <thead>
      <tr>
        <th>Product</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
	    {{#line_items}}
      <tr>
        <td>{{quantity}} &times; {{title}}</td>
        <td>{{formatted_total}}</td>
      </tr>
    {{/line_items}}
      <tr id="order-discount">
        <td>Order Discount:</td>
        <td>{{formatted_discount}}</td>
      </tr>
      <tr id="order-total">
        <td>Order Total:</td> 
        <td>{{formatted_grand_total}}</td>
      </tr>
    </tbody>
  </table>
  {{#if history}}
    <h1>History</h1>
    <table class="table">
      <tbody>
      {{#history}}
        <tr>
          <td>{{created_at}}</td>
          <td>{{note}}</td>
        </tr>
      {{/history}}
      </tbody>
    </table>
  {{/if}}
  <p><a href="#" class="btn btn-default" data-orders-screen="orders">Back</a></p>
</script>
{% endraw %}

{% javascript %}


/*
 * launchly-orders
 * https://github.com/craig/launchly-orders
 *
 * Copyright (c) 2013 Craig Sullivan
 * Licensed under the MIT license.
 */
 
orders = {
  
	/* get the current orders */
	get: function(element) {
		var url = '{{ "/__/my_orders.json" | secure_url }}';
		$.get(url, { _launch_ly_session: '{% session_id %}', authenticity_token: rails_authenticity_token }, function(data) { 
			$(orders).trigger('orders.changed', [data]);
			$(orders).trigger('orders.get', [data]);
		});
	},
	
	id: function(element) {
		return element.data('id');
	},
	
	/* get detail on an order */
	show: function(element) {
		id = orders.id(element);
		var url = '{{ "/__/my_orders/show.json" | secure_url }}';
		$.get(url, { _launch_ly_session: '{% session_id %}', authenticity_token: rails_authenticity_token, id: id }, function(data) {
			$(orders).trigger('orders.shown', [data]);
		});
	}
};

var my_orders;
var template_orders;
var template_order_detail;

$(document).on('click', '*[data-orders-screen]', function(e) {

	e.preventDefault(); 

	var orders_screen = $(this).data('orders-screen');

	$(this).html('<i class="fa fa-cog fa-spin"></i>');

	if (orders_screen == 'order-detail') {
		orders.show($(this));
	} else if (orders_screen == 'orders') {
		orders.get();
	}
});

$(document).ready(function() {
	
	template_orders = Handlebars.compile( $('#orders-template').html() );
	template_no_orders = Handlebars.compile( $('#no-orders-template').html() );
	template_order_detail = Handlebars.compile( $('#order-detail-template').html() );

	$('#orders-placeholder').html('<center><i class="fa fa-cog fa-spin" style="font-size:80pt;"></i></center>');

	orders.get();
  
	$(orders).on('orders.get', function(event, data) {
		var total_orders = data.orders.length;

		for (var i=0; i<total_orders; i++) {
			var label = 'warning';

			switch(data.orders[i].order_state) {
				case 'Completed':
					label = 'success';
					break;
				case 'Cancelled':
					label = 'danger';
					break;
			}

			data.orders[i].label = label;
		}

		var content = (total_orders > 0) ? template_orders(data) : template_no_orders() ;
			
		$('#orders-placeholder').html( content );
		$('#order-detail-placeholder').empty();
  	});
  
	$(orders).on('orders.shown', function(event, data) {
		if (data.orders.length == 1) {
			$('#orders-placeholder').empty();
			var order = data.orders[0];
			$('#order-detail-placeholder').html( template_order_detail(order) );
		}
	});

});

{% endjavascript %}