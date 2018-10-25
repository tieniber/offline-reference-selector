# Offline Reference Selector

This widget does the same as the built-in Reference Selector, except that it has the ability to dynamically filter the list of selectable items in offline mode.

## Special Thanks

This widget is based on the [Lazy Reference Selector](https://github.com/mendix/LazyReferenceSelector) widget.

## Contributing

For more information on contributing to this repository visit [Contributing to a GitHub repository](https://world.mendix.com/display/howto50/Contributing+to+a+GitHub+repository)!

## Typical usage scenario

Allows an offline Mendix app to take advantage of dynamically changing conditions for a dropdown box. For example, when selecting a make then model of a car, a user expects the list of models to be filtered to only those of the selected make.

## Features and limitations

* Selectable objects can be fetched using a Nanoflow (for offline), Microflow, or XPath constraint

## Properties
### Behavior
* Lazy load - whether to pre-load the list or wait for a listening event to load them
* On change microflow - a microflow to run after this selector changes
* On change nanoflow - a nanoflow to run after this selector changes
### Data Source
* Source entity - Source entity
* Reference entity path - Path to the referenced entity
* Display Attribute - Attribute to display in the selection dropdown
### Selectable Objects
* Listen Paths - a list of references to listen to for changes. When a change occurs on one of these paths, the selector will reload its values
* XPath constraint - XPath constraint to select only specific objects
* Microflow - Microflow to fetch selectable objects
* Nanoflow - Nanoflow to fetch selectable objects
### Display
* Show Label - whether to show the label
* Label Caption - caption for the label
* Orientation - horizontal/vertical label display, like with standard inputs
* Label weight - weight of the label column, like with standard inputs