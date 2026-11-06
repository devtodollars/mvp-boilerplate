// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'metadata_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(Metadata)
final metadataProvider = MetadataProvider._();

final class MetadataProvider
    extends $AsyncNotifierProvider<Metadata, UserMetadata?> {
  MetadataProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'metadataProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$metadataHash();

  @$internal
  @override
  Metadata create() => Metadata();
}

String _$metadataHash() => r'd2b10aa11726beedf682cb2a6328e41e7090d97c';

abstract class _$Metadata extends $AsyncNotifier<UserMetadata?> {
  FutureOr<UserMetadata?> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<AsyncValue<UserMetadata?>, UserMetadata?>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<UserMetadata?>, UserMetadata?>,
              AsyncValue<UserMetadata?>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
