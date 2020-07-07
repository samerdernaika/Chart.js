import DatasetController from './core.datasetController';
import Element from './core.element';
import Scale from './core.scale';
import TypedRegistry from './core.typedRegistry';
import {each, callback as call} from '../helpers/helpers.core';

/**
 * Please use the module's default export which provides a singleton instance
 * Note: class is exported for typedoc
 */
export class Registry {
	constructor() {
		this.controllers = new TypedRegistry(DatasetController, '');
		this.elements = new TypedRegistry(Element, 'elements');
		this.plugins = new TypedRegistry(Object, 'plugins');
		this.scales = new TypedRegistry(Scale, 'scales');
		// Order is important, Scale has Element in prototype chain,
		// so Scales must be before Elements. Plugins are a fallback, so not listed here.
		this._typedRegistries = [this.controllers, this.scales, this.elements];
	}

	/**
	 * @param  {...any} args
	 */
	add(...args) {
		this._registerEach(args);
	}

	/**
	 * @param  {...typeof DatasetController} args
	 */
	addControllers(...args) {
		this._registerEach(args, this.controllers);
	}

	/**
	 * @param  {...typeof Element} args
	 */
	addElements(...args) {
		this._registerEach(args, this.elements);
	}

	/**
	 * @param  {...any} args
	 */
	addPlugins(...args) {
		this._registerEach(args, this.plugins);
	}

	/**
	 * @param  {...typeof Scale} args
	 */
	addScales(...args) {
		this._registerEach(args, this.scales);
	}

	/**
	 * @param {string} id
	 * @returns {typeof DatasetController}
	 */
	getController(id) {
		return this._get(id, this.controllers, 'controller');
	}

	/**
	 * @param {string} id
	 * @returns {typeof Element}
	 */
	getElement(id) {
		return this._get(id, this.elements, 'element');
	}

	/**
	 * @param {string} id
	 * @returns {object}
	 */
	getPlugin(id) {
		return this._get(id, this.plugins, 'plugin');
	}

	/**
	 * @param {string} id
	 * @returns {typeof Scale}
	 */
	getScale(id) {
		return this._get(id, this.scales, 'scale');
	}

	/**
	 * @private
	 */
	_registerEach(args, typedRegistry) {
		const me = this;
		[...args].forEach(arg => {
			const reg = typedRegistry || me._getRegistryForType(arg);
			if (reg.isForType(arg)) {
				me._registerComponent(reg, arg);
			} else {
				// Handle loopable args
				// Use case:
				//  import * as plugins from './plugins';
				//  Chart.register(plugins);
				each(arg, item => {
					// If there are mixed types in the loopable, make sure those are
					// registered in correct registry
					// Use case: (treemap exporting controller, elements etc)
					//  import * as treemap from 'chartjs-chart-treemap';
					//  Chart.register(treemap);

					const itemReg = typedRegistry || me._getRegistryForType(item);
					me._registerComponent(itemReg, item);
				});
			}
		});
	}

	/**
	 * @private
	 */
	_registerComponent(registry, component) {
		call(component.beforeRegister, [], component);
		registry.register(component);
		call(component.afterRegister, [], component);
	}

	/**
	 * @private
	 */
	_getRegistryForType(type) {
		for (let i = 0; i < this._typedRegistries.length; i++) {
			const reg = this._typedRegistries[i];
			if (reg.isForType(type)) {
				return reg;
			}
		}
		// plugins is the fallback registry
		return this.plugins;
	}

	/**
	 * @private
	 */
	_get(id, typedRegistry, type) {
		const item = typedRegistry.get(id);
		if (item === undefined) {
			throw new Error('"' + id + '" is not a registered ' + type + '.');
		}
		return item;
	}

}

// singleton instance
export default new Registry();