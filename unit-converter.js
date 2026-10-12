// Unit conversion functionality
document.addEventListener('DOMContentLoaded', function() {
    const heightInput = document.getElementById('height');
    const heightUnit = document.getElementById('heightUnit');
    const heightFeetInches = document.getElementById('heightFeetInches');
    const heightFeet = document.getElementById('heightFeet');
    const heightInches = document.getElementById('heightInches');
    
    const weightInput = document.getElementById('weight');
    const weightUnit = document.getElementById('weightUnit');
    const weightStone = document.getElementById('weightStone');
    const weightStoneValue = document.getElementById('weightStoneValue');
    const weightPounds = document.getElementById('weightPounds');

    // Height conversion functions
    function cmToFeetInches(cm) {
        const totalInches = cm / 2.54;
        const feet = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        return { feet, inches };
    }

    function feetInchesToCm(feet, inches) {
        const totalInches = (feet * 12) + inches;
        return Math.round(totalInches * 2.54 * 10) / 10;
    }

    // Weight conversion functions
    function kgToLbs(kg) {
        return Math.round(kg * 2.20462 * 10) / 10;
    }

    function lbsToKg(lbs) {
        return Math.round(lbs / 2.20462 * 10) / 10;
    }

    function kgToStone(kg) {
        const totalLbs = kg * 2.20462;
        const stone = Math.floor(totalLbs / 14);
        const pounds = Math.round(totalLbs % 14);
        return { stone, pounds };
    }

    function stoneToKg(stone, pounds) {
        const totalLbs = (stone * 14) + pounds;
        return Math.round(totalLbs / 2.20462 * 10) / 10;
    }

    // Handle height unit change
    if (heightUnit) {
        heightUnit.addEventListener('change', function() {
            const currentValue = parseFloat(heightInput.value);
            
            if (this.value === 'ft') {
                // Show feet/inches inputs
                heightFeetInches.style.display = 'block';
                heightInput.style.display = 'none';
                
                // Convert cm to feet/inches if there's a value
                if (currentValue && !isNaN(currentValue)) {
                    const { feet, inches } = cmToFeetInches(currentValue);
                    heightFeet.value = feet;
                    heightInches.value = inches;
                }
                
                // Update validation
                heightInput.removeAttribute('required');
                heightFeet.setAttribute('required', 'required');
                heightInches.setAttribute('required', 'required');
            } else {
                // Show cm input
                heightFeetInches.style.display = 'none';
                heightInput.style.display = 'block';
                
                // Convert feet/inches to cm if there are values
                const feet = parseFloat(heightFeet.value);
                const inches = parseFloat(heightInches.value);
                if (!isNaN(feet) && !isNaN(inches)) {
                    heightInput.value = feetInchesToCm(feet, inches);
                }
                
                // Update validation
                heightInput.setAttribute('required', 'required');
                heightFeet.removeAttribute('required');
                heightInches.removeAttribute('required');
            }
        });

        // Update hidden cm value when feet/inches change
        if (heightFeet && heightInches) {
            const updateCmFromFeetInches = function() {
                const feet = parseFloat(heightFeet.value) || 0;
                const inches = parseFloat(heightInches.value) || 0;
                if (feet > 0 || inches > 0) {
                    heightInput.value = feetInchesToCm(feet, inches);
                }
            };
            
            heightFeet.addEventListener('input', updateCmFromFeetInches);
            heightInches.addEventListener('input', updateCmFromFeetInches);
        }
    }

    // Handle weight unit change
    if (weightUnit) {
        weightUnit.addEventListener('change', function() {
            const currentValue = parseFloat(weightInput.value);
            
            if (this.value === 'lbs') {
                // Convert kg to lbs
                weightStone.style.display = 'none';
                weightInput.style.display = 'block';
                
                if (currentValue && !isNaN(currentValue)) {
                    // If current unit was stone, convert from stone to kg first
                    if (weightStone.style.display !== 'none') {
                        const stone = parseFloat(weightStoneValue.value) || 0;
                        const pounds = parseFloat(weightPounds.value) || 0;
                        const kg = stoneToKg(stone, pounds);
                        weightInput.value = kgToLbs(kg);
                    } else {
                        weightInput.value = kgToLbs(currentValue);
                    }
                }
                
                weightInput.setAttribute('min', '44');
                weightInput.setAttribute('max', '551');
                weightInput.setAttribute('required', 'required');
                weightStoneValue.removeAttribute('required');
                weightPounds.removeAttribute('required');
            } else if (this.value === 'st') {
                // Show stone/pounds inputs
                weightStone.style.display = 'block';
                weightInput.style.display = 'none';
                
                // Convert current value to stone
                if (currentValue && !isNaN(currentValue)) {
                    let kg = currentValue;
                    // If current unit was lbs, convert to kg first
                    if (weightUnit.value === 'lbs') {
                        kg = lbsToKg(currentValue);
                    }
                    const { stone, pounds } = kgToStone(kg);
                    weightStoneValue.value = stone;
                    weightPounds.value = pounds;
                }
                
                weightInput.removeAttribute('required');
                weightStoneValue.setAttribute('required', 'required');
                weightPounds.setAttribute('required', 'required');
            } else {
                // Convert to kg
                weightStone.style.display = 'none';
                weightInput.style.display = 'block';
                
                if (currentValue && !isNaN(currentValue)) {
                    // If coming from lbs
                    const prevUnit = weightUnit.getAttribute('data-prev-unit');
                    if (prevUnit === 'lbs') {
                        weightInput.value = lbsToKg(currentValue);
                    }
                }
                
                // If coming from stone
                const stone = parseFloat(weightStoneValue.value);
                const pounds = parseFloat(weightPounds.value);
                if (!isNaN(stone) && !isNaN(pounds)) {
                    weightInput.value = stoneToKg(stone, pounds);
                }
                
                weightInput.setAttribute('min', '20');
                weightInput.setAttribute('max', '250');
                weightInput.setAttribute('required', 'required');
                weightStoneValue.removeAttribute('required');
                weightPounds.removeAttribute('required');
            }
            
            // Store current unit for next conversion
            weightUnit.setAttribute('data-prev-unit', this.value);
        });

        // Update hidden kg value when stone/pounds change
        if (weightStoneValue && weightPounds) {
            const updateKgFromStone = function() {
                const stone = parseFloat(weightStoneValue.value) || 0;
                const pounds = parseFloat(weightPounds.value) || 0;
                if (stone > 0 || pounds > 0) {
                    weightInput.value = stoneToKg(stone, pounds);
                }
            };
            
            weightStoneValue.addEventListener('input', updateKgFromStone);
            weightPounds.addEventListener('input', updateKgFromStone);
        }
    }

    // Helper function to get height in cm regardless of unit
    window.getHeightInCm = function() {
        const unit = heightUnit.value;
        if (unit === 'ft') {
            const feet = parseFloat(heightFeet.value) || 0;
            const inches = parseFloat(heightInches.value) || 0;
            return feetInchesToCm(feet, inches);
        } else {
            return parseFloat(heightInput.value) || 0;
        }
    };

    // Helper function to get weight in kg regardless of unit
    window.getWeightInKg = function() {
        const unit = weightUnit.value;
        if (unit === 'lbs') {
            return lbsToKg(parseFloat(weightInput.value) || 0);
        } else if (unit === 'st') {
            const stone = parseFloat(weightStoneValue.value) || 0;
            const pounds = parseFloat(weightPounds.value) || 0;
            return stoneToKg(stone, pounds);
        } else {
            return parseFloat(weightInput.value) || 0;
        }
    };
});
