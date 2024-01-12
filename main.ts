let max7219 = Brickcell.create()
max7219.setup(
1,
DigitalPin.P15,
DigitalPin.P14,
DigitalPin.P13,
DigitalPin.P16,
max7219_rotation_direction.clockwise,
true
)
basic.forever(function () {
    max7219.scrollText(
    "Brickcell 8x8 Dot Matrix Display",
    150,
    300
    )
})
