let max7219 = Brickcell.create()
max7219.setup(
1,
DigitalPin.P15,
DigitalPin.P14,
DigitalPin.P13,
DigitalPin.P16
)
max7219.for_4_in_1_modules(
rotation_direction.clockwise,
false
)
basic.forever(function () {
    max7219.scrollText(
    "Hello world!",
    75,
    500
    )
})
