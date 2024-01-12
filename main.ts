Brickcell.setup(
4,
DigitalPin.P15,
DigitalPin.P14,
DigitalPin.P13,
DigitalPin.P16
)
Brickcell.for_4_in_1_modules(
rotation_direction.clockwise,
false
)
basic.forever(function () {
    Brickcell.scrollText(
    "Hello world!",
    50,
    200
    )
})
