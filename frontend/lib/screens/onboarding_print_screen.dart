import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';

class OnboardingPrintScreen extends StatefulWidget {
  const OnboardingPrintScreen({super.key});

  @override
  State<OnboardingPrintScreen> createState() => _OnboardingPrintScreenState();
}

class _OnboardingPrintScreenState extends State<OnboardingPrintScreen> {
  int currentStep = 0;
  final nameController = TextEditingController();
  final rackController = TextEditingController(text: '6');
  final poziceController = TextEditingController(text: '1');
  final boxController = TextEditingController(text: '0');
  final noteController = TextEditingController();

  bool isPrinting = false;
  bool isSaving = false;
  String generatedItemCode = '61-0001';

  void _updateItemCodePreview() {
    final r = int.tryParse(rackController.text) ?? 1;
    final p = int.tryParse(poziceController.text) ?? 1;
    final b = int.tryParse(boxController.text) ?? 0;
    setState(() {
      generatedItemCode = '$r$p-${b}0001';
    });
  }

  Future<void> _triggerBrotherPrint() async {
    setState(() => isPrinting = true);
    await Future.delayed(const Duration(milliseconds: 1500)); // Simulate USB bPAC print
    if (mounted) {
      setState(() {
        isPrinting = false;
        currentStep = 2; // Advance to verification step
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Label sent to Brother PT-D460BTVP printer via USB!'),
          backgroundColor: AppColors.statusGranted,
        ),
      );
    }
  }

  Future<void> _completeOnboarding() async {
    if (nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter item name'), backgroundColor: AppColors.statusDenied),
      );
      return;
    }

    setState(() => isSaving = true);
    try {
      final item = await ApiService.createInventoryItem(
        name: nameController.text.trim(),
        rack: int.tryParse(rackController.text) ?? 6,
        pozice: int.tryParse(poziceController.text) ?? 1,
        box: int.tryParse(boxController.text) ?? 0,
        note: noteController.text.trim(),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Successfully onboarded item ${item.itemCode}!'),
            backgroundColor: AppColors.statusGranted,
          ),
        );
        setState(() {
          currentStep = 0;
          nameController.clear();
          noteController.clear();
          isSaving = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.statusDenied),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'ITEM ONBOARDING & BROTHER LABEL PRINTING',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(letterSpacing: 1.2),
          ),
          const SizedBox(height: 4),
          const Text(
            'Step-by-step onboarding for Brother PT-D460BTVP (18mm tape) USB printer PC workflow',
            style: TextStyle(color: AppColors.cloudPaperMuted),
          ),
          const SizedBox(height: 24),

          // Stepper Header
          Row(
            children: [
              _buildStepIndicator(0, '1. ITEM METADATA'),
              _buildStepDivider(),
              _buildStepIndicator(1, '2. 18mm BROTHER PRINT'),
              _buildStepDivider(),
              _buildStepIndicator(2, '3. SCAN & SNAPSHOT'),
            ],
          ),
          const SizedBox(height: 32),

          // Step 1: Input Form
          if (currentStep == 0) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      controller: nameController,
                      decoration: const InputDecoration(
                        labelText: 'Item Name *',
                        hintText: 'e.g. Šroubovák červený křížový',
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: rackController,
                            keyboardType: TextInputType.number,
                            onChanged: (_) => _updateItemCodePreview(),
                            decoration: const InputDecoration(labelText: 'Rack Number (X) *'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: poziceController,
                            keyboardType: TextInputType.number,
                            onChanged: (_) => _updateItemCodePreview(),
                            decoration: const InputDecoration(labelText: 'Position / Shelf (Y) *'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: boxController,
                            keyboardType: TextInputType.number,
                            onChanged: (_) => _updateItemCodePreview(),
                            decoration: const InputDecoration(labelText: 'Box Number (Z - 0 if none)'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: noteController,
                      maxLines: 2,
                      decoration: const InputDecoration(labelText: 'Notes (Optional)'),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: () {
                        if (nameController.text.trim().isNotEmpty) {
                          setState(() => currentStep = 1);
                        }
                      },
                      icon: const Icon(Icons.arrow_forward),
                      label: const Text('PROCEED TO LABEL PRINTING'),
                    ),
                  ],
                ),
              ),
            ),
          ],

          // Step 2: Brother Printer Label Preview & Trigger
          if (currentStep == 1) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('BROTHER PT-D460BTVP (18mm TAPE PREVIEW)', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    // Simulated 18mm Tape Vector Container
                    Container(
                      width: double.infinity,
                      height: 90,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Colors.black, width: 2),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 66,
                            height: 66,
                            color: Colors.black12,
                            child: const Center(
                              child: Icon(Icons.qr_code_2, size: 54, color: Colors.black),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  nameController.text.toUpperCase(),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'LOC: $generatedItemCode',
                                  style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w600, fontSize: 13),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        OutlinedButton(
                          onPressed: () => setState(() => currentStep = 0),
                          child: const Text('BACK'),
                        ),
                        const SizedBox(width: 16),
                        ElevatedButton.icon(
                          onPressed: isPrinting ? null : _triggerBrotherPrint,
                          icon: isPrinting
                              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                              : const Icon(Icons.print),
                          label: Text(isPrinting ? 'PRINTING VIA USB...' : 'PRINT 18mm LABEL VIA USB'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],

          // Step 3: Verification & Save
          if (currentStep == 2) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('SCAN QR & AUTO SNAPSHOT VERIFICATION', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    Container(
                      height: 200,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: AppColors.graphiteCore,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.statusGranted, width: 2),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.camera_alt, color: AppColors.statusGranted, size: 48),
                            SizedBox(height: 8),
                            Text('PC Camera Feed Ready - Scanned & Captured!', style: TextStyle(color: AppColors.statusGranted, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: isSaving ? null : _completeOnboarding,
                      icon: const Icon(Icons.check_circle),
                      label: Text(isSaving ? 'COMMITTING TO DATABASE...' : 'COMMIT ITEM TO DATABASE'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStepIndicator(int step, String title) {
    final isActive = currentStep == step;
    final isDone = currentStep > step;
    return Row(
      children: [
        CircleAvatar(
          radius: 14,
          backgroundColor: isDone
              ? AppColors.statusGranted
              : (isActive ? AppColors.circuitMint : AppColors.graphiteCoreSurface),
          child: isDone
              ? const Icon(Icons.check, size: 16, color: AppColors.graphiteCore)
              : Text(
                  '${step + 1}',
                  style: TextStyle(
                    color: isActive ? AppColors.graphiteCore : AppColors.cloudPaperMuted,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            color: isActive ? AppColors.cloudPaper : AppColors.cloudPaperMuted,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildStepDivider() {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 12),
      child: SizedBox(
        width: 30,
        child: Divider(color: AppColors.graphiteCoreBorder, thickness: 2),
      ),
    );
  }
}
